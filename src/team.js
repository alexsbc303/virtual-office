/**
 * AS bot team roster for the virtual office.
 * Colours and accessories are fixed per brief — do not invent live status here.
 * dept* follow sidebar section categories.
 */
export const TEAM = [
  {
    id: '664766c4-1928-4909-8d79-90a3c38f786c',
    name: 'Bot 總管',
    color: '#C2185B',
    deptEn: 'Reception / 總管',
    deptZh: '總管',
    accessory: 'document tray',
    isLead: true,
  },
  {
    id: '26fffc1c-3c69-4346-8a68-199db47277fd',
    name: 'Scheduler / Morning Ops',
    color: '#2E7D32',
    deptEn: 'ITSS1',
    deptZh: 'ITSS1',
    accessory: 'calendar binder',
    isLead: false,
  },
  {
    id: '4f070b62-ac92-4824-9953-886cda5433d1',
    name: 'Lotus Notes Agent',
    color: '#607D8B',
    deptEn: 'ITSS1',
    deptZh: 'ITSS1',
    accessory: 'mail folder',
    isLead: false,
  },
  {
    id: 'aecd27e2-8d49-4c33-962c-cdfa1860fd26',
    name: 'Infrastructure Bot',
    color: '#00897B',
    deptEn: 'ITSS1',
    deptZh: 'ITSS1',
    accessory: 'technical file',
    isLead: false,
  },
  {
    id: 'b7c9b07d-4a12-49af-bbdf-7fa19bdc96b2',
    name: 'Coding Bot',
    color: '#3949AB',
    deptEn: 'Programming',
    deptZh: '編程',
    accessory: 'tablet',
    isLead: false,
  },
  {
    id: '5f8f09c0-fe3d-40a5-87c1-2fcc440bb9c3',
    name: 'ai-project-assessment-validator',
    color: '#6D4C41',
    deptEn: 'ITSS1',
    deptZh: 'ITSS1',
    accessory: 'assessment binder',
    isLead: false,
  },
  {
    id: 'c7f037b0-0082-4290-a543-00f203e4c150',
    name: 'HK Gov IT Security Expert',
    color: '#1A237E',
    deptEn: 'ITSS1',
    deptZh: 'ITSS1',
    accessory: 'security pass',
    isLead: false,
  },
  {
    id: '764c93f4-9330-4daa-9f86-481be3b19e60',
    name: 'Grok Bot Coach',
    color: '#212121',
    deptEn: 'Self Enhancement',
    deptZh: 'Self Enhancement',
    accessory: 'checklist clipboard',
    isLead: false,
  },
  {
    id: 'e6df6ca8-5abd-43f5-8f47-4175b801b4c4',
    name: 'dr eggbot',
    color: '#7B1FA2',
    deptEn: 'Self Enhancement',
    deptZh: 'Self Enhancement',
    accessory: 'blueprint folio',
    isLead: false,
  },
  {
    id: '28c84d63-5b73-4b78-aebc-3a2e02376fc2',
    name: '港式中英文寫作助手',
    color: '#1565C0',
    deptEn: 'General',
    deptZh: 'General',
    accessory: 'document folder',
    isLead: false,
  },
  {
    id: '2fb3b7e8-b556-45ea-8b10-1ced7f05c0b4',
    name: '雙語會議紀錄與簡報',
    color: '#1976D2',
    deptEn: 'General',
    deptZh: 'General',
    accessory: 'minutes folder',
    isLead: false,
  },
  {
    id: '6a0dc819-57c2-4507-ae25-f3b3122c3f46',
    name: '報價與消費助手',
    color: '#C62828',
    deptEn: 'General',
    deptZh: 'General',
    accessory: 'quotation file',
    isLead: false,
  },
  {
    id: '9f0fa493-9994-409c-b398-974b67de306e',
    name: '日程助理',
    color: '#EF6C00',
    deptEn: 'General',
    deptZh: 'General',
    accessory: 'diary',
    isLead: false,
  },
];

export const LEAD_ID = '664766c4-1928-4909-8d79-90a3c38f786c';

export function getTeamMember(id) {
  return TEAM.find((m) => m.id === id) ?? null;
}
