const STORAGE_KEYS = {
    LINES: 'chatbot_lines',
    EQUIPMENT: 'chatbot_equipment',
    SYMPTOMS: 'chatbot_symptoms',
    SYMPTOM_CATEGORIES: 'chatbot_symptom_categories',
    PARTS: 'chatbot_parts',
    REQUESTS: 'chatbot_requests',
    NOTIFICATIONS: 'chatbot_notifications',
    STAFF: 'chatbot_staff',
    SETTINGS: 'chatbot_settings',
};

// Default constants (fallback)
const DEFAULT_SHIFT_HOURS = {
    MORNING: { start: 6, end: 14, label: '오전' },
    AFTERNOON: { start: 14, end: 22, label: '오후' },
    NIGHT: { start: 22, end: 6, label: '야간' }
};

export const storage = {
    get: (key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },

    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage set error:', e);
        }
    },

    init: () => {
        if (!storage.get(STORAGE_KEYS.LINES)) {
            storage.set(STORAGE_KEYS.LINES, ['A 라인', 'B 라인', 'C 라인', 'D 라인']);
        }
        if (!storage.get(STORAGE_KEYS.EQUIPMENT)) {
            storage.set(STORAGE_KEYS.EQUIPMENT, [
                { line: 'A 라인', name: '프레스 #1', code: 'PR-A-001' },
                { line: 'A 라인', name: '프레스 #2', code: 'PR-A-002' },
                { line: 'B 라인', name: '컨베이어 #1', code: 'CV-B-001' },
                { line: 'B 라인', name: '로봇 암 #1', code: 'RB-B-001' },
                { line: 'C 라인', name: '용접기 #1', code: 'WD-C-001' },
            ]);
        }
        if (!storage.get(STORAGE_KEYS.SYMPTOMS)) {
            storage.set(STORAGE_KEYS.SYMPTOMS, ['소음 발생', '과열 의심', '정지 발생', '누유 발견', '기타']);
        }
        if (!storage.get(STORAGE_KEYS.SYMPTOM_CATEGORIES)) {
            storage.set(STORAGE_KEYS.SYMPTOM_CATEGORIES, [
                '소음/진동', '과열', '누유/누수', '정지/오류', '오류코드', '기타'
            ]);
        }
        if (!storage.get(STORAGE_KEYS.PARTS)) {
            storage.set(STORAGE_KEYS.PARTS, [
                { code: 'PT-001', name: '베어링', category: '기계부품' },
                { code: 'PT-002', name: '벨트', category: '소모품' },
                { code: 'PT-003', name: '필터', category: '소모품' },
                { code: 'PT-004', name: '센서', category: '전기부품' },
                { code: 'PT-005', name: '유압호스', category: '유압부품' },
            ]);
        }
        if (!storage.get(STORAGE_KEYS.STAFF)) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const sampleSchedule = {};

            for (let i = 1; i <= 31; i++) {
                const day = String(i).padStart(2, '0');
                const dateKey = `${year}-${month}-${day}`;
                if (i <= 10) sampleSchedule[dateKey] = 'MORNING';
                else if (i <= 20) sampleSchedule[dateKey] = 'AFTERNOON';
                else sampleSchedule[dateKey] = 'NIGHT';
            }

            storage.set(STORAGE_KEYS.STAFF, [
                {
                    id: 1,
                    name: '김정비',
                    role: 'MAINTENANCE',
                    position: '팀장',
                    monthlySchedule: { ...sampleSchedule }
                },
                {
                    id: 2,
                    name: '박엔지',
                    role: 'MAINTENANCE',
                    position: '사원',
                    monthlySchedule: { ...sampleSchedule, [`${year}-${month}-21`]: 'OFF' }
                },
                {
                    id: 3,
                    name: '이생산',
                    role: 'PRODUCTION',
                    position: '반장',
                    monthlySchedule: {}
                },
            ]);
        }
        if (!storage.get(STORAGE_KEYS.REQUESTS)) storage.set(STORAGE_KEYS.REQUESTS, []);
        if (!storage.get(STORAGE_KEYS.NOTIFICATIONS)) storage.set(STORAGE_KEYS.NOTIFICATIONS, []);
    },

    lines: {
        getAll: () => storage.get(STORAGE_KEYS.LINES) || [],
    },

    equipment: {
        getAll: () => storage.get(STORAGE_KEYS.EQUIPMENT) || [],
        getByLine: (line) => (storage.get(STORAGE_KEYS.EQUIPMENT) || []).filter(e => e.line === line),
    },

    symptoms: {
        getAll: () => storage.get(STORAGE_KEYS.SYMPTOMS) || [],
    },

    symptomCategories: {
        getAll: () => storage.get(STORAGE_KEYS.SYMPTOM_CATEGORIES) || [],
    },

    parts: {
        getAll: () => storage.get(STORAGE_KEYS.PARTS) || [],
    },

    staff: {
        getAll: () => storage.get(STORAGE_KEYS.STAFF) || [],
        save: (staffList) => storage.set(STORAGE_KEYS.STAFF, staffList),
        getWorkingStaff: (role) => {
            const allStaff = storage.staff.getAll();
            const now = new Date();
            const currentHour = now.getHours();

            // 1. Load Shift Settings
            const settings = storage.get(STORAGE_KEYS.SETTINGS);
            const shifts = settings?.shiftHours || {
                MORNING: { start: 6, end: 14 },
                AFTERNOON: { start: 14, end: 22 },
                NIGHT: { start: 22, end: 6 }
            };

            // 2. Determine Current Shift
            let currentShift = 'OFF';
            let checkDate = now;

            const isInShift = (start, end, hour) => {
                if (start < end) return hour >= start && hour < end;
                return hour >= start || hour < end; // Overnight shift
            };

            if (isInShift(shifts.MORNING.start, shifts.MORNING.end, currentHour)) {
                currentShift = 'MORNING';
            } else if (isInShift(shifts.AFTERNOON.start, shifts.AFTERNOON.end, currentHour)) {
                currentShift = 'AFTERNOON';
            } else if (isInShift(shifts.NIGHT.start, shifts.NIGHT.end, currentHour)) {
                currentShift = 'NIGHT';
                // If currently in Night shift and it's morning (e.g., 00:00 - 06:00), 
                // it belongs to previous day's schedule logically
                if (currentHour < shifts.NIGHT.end) {
                    checkDate = new Date(now);
                    checkDate.setDate(now.getDate() - 1);
                }
            }

            const dateKey = checkDate.toISOString().slice(0, 10);

            return allStaff.filter(s => {
                if (s.role !== role) return false;
                const scheduledShift = s.monthlySchedule?.[dateKey];
                return scheduledShift === currentShift;
            });
        }
    },

    requests: {
        getAll: () => storage.get(STORAGE_KEYS.REQUESTS) || [],
        getById: (id) => storage.requests.getAll().find(r => r.id === id),
        isDelayed: (request) => {
            if (request.status === '정비완료') return false;

            const slaHours = {
                '높음 (1시간)': 1,
                '보통 (4시간)': 4,
                '낮음 (당일)': 24
            };

            const priorityKey = request.priority || '보통 (4시간)';
            const slaMilliseconds = (slaHours[priorityKey] || 4) * 60 * 60 * 1000;

            const requestTime = new Date(request.time).getTime();
            const now = new Date().getTime();
            const elapsed = now - requestTime;

            return elapsed > slaMilliseconds;
        },
        getNextId: () => {
            const requests = storage.requests.getAll();
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            const todayRequests = requests.filter(r => r.id.startsWith(`REQ-${dateStr}`));
            const sequence = String(todayRequests.length + 1).padStart(3, '0');
            return `REQ-${dateStr}-${sequence}`;
        },
        save: (request) => {
            const requests = storage.requests.getAll();
            const newId = request.id || storage.requests.getNextId();

            const newRequest = {
                ...request,
                id: newId,
                time: new Date().toLocaleString(),
                status: '접수완료',
                priority: request.priority || '보통',
                symptomCategory: request.symptomCategory || '기타',
                history: [{
                    status: '접수완료',
                    time: new Date().toLocaleString(),
                    note: '정비 요청이 신규 접수되었습니다.',
                    updater: '시스템'
                }],
                resultPhotos: {
                    before: request.images || [],
                    after: []
                },
                completionReport: null
            };
            requests.unshift(newRequest);
            storage.set(STORAGE_KEYS.REQUESTS, requests);

            const detailLink = `/maintenance/request/${newId}`;
            storage.notifications.add({
                to: 'MAINTENANCE',
                message: `[접수완료 알림] ${request.machine}에 정비 요청이 등록되었습니다.`,
                requestId: newId,
                link: detailLink
            });

            return newRequest;
        },
        updateStatus: (id, status, note = '', updater = '정비팀', afterPhoto = null, completionData = null) => {
            const requests = storage.requests.getAll();
            const index = requests.findIndex(r => r.id === id);
            if (index > -1) {
                const req = requests[index];
                req.status = status;
                req.history.push({
                    status,
                    time: new Date().toLocaleString(),
                    note,
                    updater
                });

                if (afterPhoto && req.resultPhotos) {
                    if (Array.isArray(afterPhoto)) {
                        req.resultPhotos.after = afterPhoto;
                    } else {
                        req.resultPhotos.after = [afterPhoto];
                    }
                }

                if (status === '정비완료' && completionData) {
                    req.completionReport = {
                        ...completionData,
                        completedBy: updater,
                        completedAt: new Date().toLocaleString()
                    };
                }

                storage.set(STORAGE_KEYS.REQUESTS, requests);

                storage.notifications.add({
                    to: 'PRODUCTION',
                    message: `[상태 업데이트] 요청하신 ${req.machine} 정비 상태가 [${status}]로 변경되었습니다.`,
                    requestId: id
                });
            }
        },
        addAdditionalInfo: (id, additionalInfo) => {
            const requests = storage.requests.getAll();
            const index = requests.findIndex(r => r.id === id);
            if (index > -1) {
                const req = requests[index];
                req.additionalInfo = additionalInfo;
                req.history.push({
                    status: req.status,
                    time: new Date().toLocaleString(),
                    note: '작업자가 추가 정보를 제출했습니다.',
                    updater: '시스템'
                });
                storage.set(STORAGE_KEYS.REQUESTS, requests);

                storage.notifications.add({
                    to: 'MAINTENANCE',
                    message: `[추가정보 도착] ${req.id} - ${req.machine}`,
                    requestId: id,
                    link: `/maintenance/request/${id}`
                });
            }
        }
    },

    notifications: {
        getAll: () => storage.get(STORAGE_KEYS.NOTIFICATIONS) || [],
        add: (noti) => {
            const list = storage.notifications.getAll();
            const now = new Date();

            let activeRecipients = [];
            if (noti.to === 'MAINTENANCE' || noti.to === 'PRODUCTION') {
                activeRecipients = storage.staff.getWorkingStaff(noti.to);
            }

            const isDND = activeRecipients.length === 0;

            const newNoti = {
                ...noti,
                id: Date.now(),
                read: false,
                time: now.toLocaleTimeString(),
                recipients: activeRecipients.map(s => s.name),
                isDND: isDND
            };

            list.unshift(newNoti);
            storage.set(STORAGE_KEYS.NOTIFICATIONS, list);

            if (!isDND) {
                const recipientNames = activeRecipients.map(s => s.name).join(', ');
                const enhancedNoti = { ...noti, message: `${noti.message} (발송됨: ${recipientNames})` };
                window.dispatchEvent(new CustomEvent('new_notification', { detail: enhancedNoti }));
            } else {
                console.log('DND Mode: No active staff found for notification.', noti.to);
            }
        },
        markAsRead: (id) => {
            const list = storage.notifications.getAll().map(n => n.id === id ? { ...n, read: true } : n);
            storage.set(STORAGE_KEYS.NOTIFICATIONS, list);
        }
    }
};

storage.init();
