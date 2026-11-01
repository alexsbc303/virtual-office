/**
 * Portal handoff — a local queue plus an optional public webhook.
 * This does not open Cursor chat and does not write Supabase with the anon key.
 *
 * POST ${VITE_HANDOFF_WEBHOOK_URL}  (https or http, public URL only)
 * Content-Type: application/json
 * {
 *   "type": "portal_handoff",
 *   "id": "<uuid>",
 *   "created_at": "<ISO-8601>",
 *   "source": "virtual-office",
 *   "bot": { "id": "<uuid>", "name": "<display name>", "dept": "<deptEn>" },
 *   "lead": { "id": "664766c4-1928-4909-8d79-90a3c38f786c", "name": "Bot 總管" },
 *   "message": "<operator text, 1–500 chars>"
 * }
 * The page also dispatches window event "vo-portal-handoff" with that JSON as detail.
 * Operators who want a row can apply sql/portal_handoffs.sql and insert with the service role.
 */
import { LEAD_ID, getTeamMember } from './team.js';

const STORAGE_KEY = 'vo.portal.handoffs.v1';
const MAX_ITEMS = 30;
const MAX_MESSAGE = 500;
const WEBHOOK_TIMEOUT_MS = 8000;

const lead = getTeamMember(LEAD_ID);

function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Public URL only. Rejects blank values and anything that looks like a service-role secret. */
export function handoffWebhookUrl() {
  const raw = String(import.meta.env.VITE_HANDOFF_WEBHOOK_URL || '').trim();
  if (!raw || /service[_-]?role/i.test(raw)) return '';
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

export function loadHandoffs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHandoffs(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* private mode / quota — the in-memory copy still renders */
  }
}

/**
 * @param {object} bot
 * @param {string} message
 */
export function buildHandoffPayload(bot, message, id = newId(), createdAt = new Date().toISOString()) {
  return {
    type: 'portal_handoff',
    id,
    created_at: createdAt,
    source: 'virtual-office',
    bot: {
      id: bot.id,
      name: bot.name,
      dept: bot.deptEn || '',
    },
    lead: {
      id: LEAD_ID,
      name: lead?.name || 'Bot 總管',
    },
    message: String(message || '').trim().slice(0, MAX_MESSAGE),
  };
}

/**
 * Persist locally first, emit the handoff event, then POST if a webhook is set.
 * @returns {Promise<{ record: object, items: object[], webhook: boolean }>}
 */
export async function submitHandoff(bot, message) {
  const payload = buildHandoffPayload(bot, message);
  if (!payload.message) {
    throw new Error('empty');
  }
  const record = {
    ...payload,
    delivery: 'local',
    http_status: null,
  };
  const items = [record, ...loadHandoffs()].slice(0, MAX_ITEMS);
  saveHandoffs(items);
  window.dispatchEvent(new CustomEvent('vo-portal-handoff', { detail: payload }));

  const hook = handoffWebhookUrl();
  if (!hook) {
    return { record, items, webhook: false };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    const res = await fetch(hook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    record.delivery = res.ok ? 'sent' : 'failed';
    record.http_status = res.status;
  } catch {
    record.delivery = 'failed';
  } finally {
    clearTimeout(timer);
  }
  saveHandoffs(items);
  return { record, items, webhook: true };
}

export function handoffsFor(botId) {
  return loadHandoffs().filter((item) => item?.bot?.id === botId);
}

export function deliveryLabel(delivery) {
  if (delivery === 'sent') return '已交總管 · webhook accepted';
  if (delivery === 'failed') return '已交總管 · 本機佇列（webhook 未送達）';
  return '已交總管 · 本機佇列';
}

/**
 * Wire the portal panel. Works with no webhook configured.
 * @param {{ onChange?: () => void, onActivity?: (text: string) => void }} hooks
 */
export function mountPortal(hooks = {}) {
  const panel = document.getElementById('portal-panel');
  const botEl = document.getElementById('portal-bot');
  const deptEl = document.getElementById('portal-dept');
  const form = document.getElementById('portal-form');
  const input = document.getElementById('portal-input');
  const send = document.getElementById('portal-send');
  const confirmEl = document.getElementById('portal-confirm');
  const queueEl = document.getElementById('portal-queue');
  const closeBtn = document.getElementById('portal-close');

  /** @type {object | null} */
  let selected = null;
  let sending = false;

  function countFor(botId) {
    return handoffsFor(botId).length;
  }

  function renderQueue() {
    queueEl.replaceChildren();
    if (!selected) return;
    const rows = handoffsFor(selected.id);
    if (!rows.length) {
      const li = document.createElement('li');
      li.className = 'portal-item portal-empty';
      li.textContent = 'No handoffs yet · 尚未送出';
      queueEl.appendChild(li);
      return;
    }
    for (const row of rows) {
      const li = document.createElement('li');
      li.className = 'portal-item';
      const meta = document.createElement('div');
      meta.className = 'portal-item-meta';
      const when = row.created_at ? new Date(row.created_at) : new Date();
      const clock = Number.isNaN(when.getTime())
        ? ''
        : when.toLocaleTimeString('en-HK', {
            timeZone: 'Asia/Hong_Kong',
            hour: 'numeric',
            minute: '2-digit',
          });
      meta.textContent = `${clock} · ${deliveryLabel(row.delivery)}`;
      const msg = document.createElement('div');
      msg.className = 'portal-item-msg';
      msg.textContent = row.message || '';
      li.append(meta, msg);
      queueEl.appendChild(li);
    }
  }

  function syncForm() {
    const ready = !!selected && !sending && input.value.trim().length > 0;
    input.disabled = !selected || sending;
    send.disabled = !ready;
  }

  function select(member) {
    if (!member) return;
    selected = member;
    panel.hidden = false;
    botEl.textContent = member.name;
    deptEl.textContent = `${member.deptEn} · ${member.deptZh}`;
    renderQueue();
    syncForm();
    input.focus();
  }

  function close() {
    panel.hidden = true;
  }

  closeBtn.addEventListener('click', close);
  input.addEventListener('input', syncForm);
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!selected || sending) return;
    const text = input.value.trim();
    if (!text) return;
    sending = true;
    syncForm();
    try {
      const { record } = await submitHandoff(selected, text);
      input.value = '';
      confirmEl.hidden = false;
      confirmEl.textContent = deliveryLabel(record.delivery);
      hooks.onActivity?.(`${selected.name}: ${deliveryLabel(record.delivery)}`);
      renderQueue();
      hooks.onChange?.();
    } catch (err) {
      if (err?.message !== 'empty') {
        confirmEl.hidden = false;
        confirmEl.textContent = '未送出 · 請再試';
      }
    } finally {
      sending = false;
      syncForm();
    }
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !panel.hidden) close();
  });

  syncForm();
  return { select, close, countFor, selectedId: () => selected?.id || '' };
}
