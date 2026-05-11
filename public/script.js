const STORAGE_KEY = 'berkeley-form-state-v1';

export function parseTimeToMs(timeStr, fieldLabel) {
    const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(timeStr);
    if (!match) {
        throw new Error(`${fieldLabel} deve estar no formato HH:MM ou HH:MM:SS.`);
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3] || '00');

    if (hours > 23 || minutes > 59 || seconds > 59) {
        throw new Error(`${fieldLabel} contem um horario invalido.`);
    }

    return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

export function msToTimeString(ms) {
    const dayMs = 24 * 60 * 60 * 1000;
    const normalizedMs = ((Math.round(ms) % dayMs) + dayMs) % dayMs;
    const totalSeconds = Math.floor(normalizedMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0')
    ].join(':');
}

export function formatAdjustment(ms) {
    if (ms === 0) return '0 s';

    const sign = ms < 0 ? '-' : '+';
    const absMs = Math.abs(ms);
    const totalSeconds = Math.floor(absMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return minutes > 0
            ? `${sign}${hours} h ${minutes} min`
            : `${sign}${hours} h`;
    }

    if (minutes > 0) {
        return seconds > 0
            ? `${sign}${minutes} min ${seconds} s`
            : `${sign}${minutes} min`;
    }

    return `${sign}${seconds} s`;
}

export function formatRankingTime(ms) {
    if (!Number.isFinite(ms)) {
        return '--:--:--';
    }

    return msToTimeString(ms);
}

export function getUserFacingErrorMessage(error) {
    if (error instanceof Error) {
        if (error.message.includes('Cannot set properties of null') || error.message.includes('Cannot read properties of null')) {
            return 'A interface ficou inconsistente depois da última alteração. Recarregue a página e tente novamente.';
        }

        return error.message;
    }

    return 'Ocorreu um erro inesperado na interface. Recarregue a página e tente novamente.';
}

function getRequiredElement(root, id, label) {
    const element = root.getElementById(id);

    if (!element) {
        throw new Error(`A interface não carregou corretamente (${label}). Recarregue a página.`);
    }

    return element;
}

function getRequiredBody(root, selector, label) {
    const element = root.querySelector(selector);

    if (!element) {
        throw new Error(`A interface não carregou corretamente (${label}). Recarregue a página.`);
    }

    return element;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function renderRankingTable(tableBody, ranking, getTimeValue) {
    tableBody.innerHTML = ranking.map((res, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${res.name}</td>
            <td>${formatRankingTime(getTimeValue(res))}</td>
        </tr>
    `).join('');
}

export function renderSyncResults(view, data) {
    if (!data.results || data.results.length === 0) {
        throw new Error('Resposta sem resultados de sincronizacao.');
    }

    view.resultsSection.classList.remove('hidden');

    const globalTimeMs = data.results[0].synchronizedTimeMs;
    view.globalClockValue.textContent = msToTimeString(globalTimeMs);

    if (view.heroClockValue) {
        view.heroClockValue.textContent = msToTimeString(globalTimeMs);
    }

    const clientResults = data.results.filter((res) => !res.isServer);
    const rankings = {
        before: Array.isArray(data.rankingBefore) ? data.rankingBefore.filter((res) => !res.isServer) : [],
        after: Array.isArray(data.rankingAfter) ? data.rankingAfter.filter((res) => !res.isServer) : []
    };
    const firstSend = rankings.before.find((item) => Number.isFinite(item.sendTimeMs));
    const lastAdjusted = [...rankings.after].reverse().find((item) => Number.isFinite(item.synchronizedSendTimeMs));

    view.statClientsCount.textContent = String(clientResults.length);
    view.statFirstSend.textContent = formatRankingTime(firstSend?.sendTimeMs);
    view.statLastAdjustedSend.textContent = formatRankingTime(lastAdjusted?.synchronizedSendTimeMs);

    view.tableAdjustments.innerHTML = clientResults.map((res) => `
        <tr>
            <td>${res.name}</td>
            <td>${formatAdjustment(res.adjustmentMs)}</td>
            <td>${msToTimeString(res.synchronizedTimeMs)}</td>
        </tr>
    `).join('');

    renderRankingTable(view.tableRankingBefore, rankings.before, (res) => res.sendTimeMs);
    renderRankingTable(view.tableRankingAfter, rankings.after, (res) => res.synchronizedSendTimeMs);
}

export function initializeApp(root = document) {
    const elements = {
        clientsContainer: getRequiredElement(root, 'clientsContainer', 'lista de clientes'),
        clientsEmptyState: getRequiredElement(root, 'clientsEmptyState', 'estado vazio de clientes'),
        clientsCountPill: getRequiredElement(root, 'clientsCountPill', 'contador de clientes'),
        addClientBtn: getRequiredElement(root, 'addClientBtn', 'botão de adicionar cliente'),
        syncBtn: getRequiredElement(root, 'syncBtn', 'botão de sincronização'),
        resultsSection: getRequiredElement(root, 'resultsSection', 'painel de resultados'),
        formStatus: getRequiredElement(root, 'formStatus', 'área de mensagens'),
        serverTime: getRequiredElement(root, 'serverTime', 'campo de horário do servidor'),
        globalClockValue: getRequiredElement(root, 'globalClockValue', 'clock global'),
        statClientsCount: getRequiredElement(root, 'statClientsCount', 'contador de clientes sincronizados'),
        statFirstSend: getRequiredElement(root, 'statFirstSend', 'primeiro envio'),
        statLastAdjustedSend: getRequiredElement(root, 'statLastAdjustedSend', 'último envio ajustado'),
        tableAdjustments: getRequiredBody(root, '#tableAdjustments tbody', 'tabela de ajustes'),
        tableRankingBefore: getRequiredBody(root, '#tableRankingBefore tbody', 'ranking original'),
        tableRankingAfter: getRequiredBody(root, '#tableRankingAfter tbody', 'ranking sincronizado'),
        heroClockValue: root.getElementById('heroClockValue')
    };

    elements.addClientBtn.addEventListener('click', addClient);
    root.querySelectorAll('.time-input').forEach(applyTimeMask);
    restoreFormState();
    updateClientsEmptyState();

    elements.serverTime.addEventListener('input', saveFormState);

    elements.syncBtn.addEventListener('click', async () => {
        try {
            clearStatus();
            setBusyState(true);
            const payload = buildPayload();
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Não foi possível sincronizar os relógios. Verifique os dados informados e tente novamente.');
            }

            const data = await response.json();
            renderSyncResults(elements, data);
            showStatus('Sincronização concluída com sucesso.', 'success');
        } catch (error) {
            console.error('Erro ao sincronizar:', error);
            showStatus(getUserFacingErrorMessage(error), 'error');
        } finally {
            setBusyState(false);
        }
    });

    function addClient(clientData = {}, options = {}) {
        const {
            shouldFocus = true,
            shouldScroll = true,
            shouldSave = true
        } = options;
        const currentClients = elements.clientsContainer.querySelectorAll('.client-input').length;
        const clientName = clientData.name || `Cliente ${currentClients + 1}`;
        const localTime = clientData.localTime || '';
        const hasSendTime = Boolean(clientData.hasSendTime);
        const sendTime = clientData.sendTime || '';
        const div = root.createElement('div');
        div.className = 'client-input';
        div.innerHTML = `
            <div class="client-topbar">
                <input type="text" class="client-name" placeholder="Nome do cliente" value="${escapeHtml(clientName)}">
                <button class="remove-btn" type="button" aria-label="Remover cliente">×</button>
            </div>
            <div class="client-grid">
                <div class="field-pair">
                    <small>Hora Local</small>
                    <input type="text" class="time-input" placeholder="HH:MM ou HH:MM:SS" maxlength="8" value="${escapeHtml(localTime)}">
                </div>
                <div class="field-pair send-time-field ${hasSendTime ? '' : 'hidden'}">
                    <small>Hora de Envio</small>
                    <input type="text" class="time-input send-time-input" placeholder="HH:MM ou HH:MM:SS" maxlength="8" value="${escapeHtml(sendTime)}">
                </div>
            </div>
            <label class="send-toggle">
                <input type="checkbox" class="send-time-checkbox" ${hasSendTime ? 'checked' : ''}>
                <span>Informar hora de envio</span>
            </label>
        `;
        elements.clientsContainer.appendChild(div);
        div.querySelectorAll('.time-input').forEach(applyTimeMask);
        bindClientEvents(div);
        updateClientsEmptyState();

        if (shouldSave) {
            saveFormState();
        }

        if (shouldFocus) {
            focusClientCard(div, shouldScroll);
        }
    }

    function applyTimeMask(input) {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 6) value = value.slice(0, 6);

            let formattedValue = '';
            for (let i = 0; i < value.length; i++) {
                if (i === 2 || i === 4) formattedValue += ':';
                formattedValue += value[i];
            }

            e.target.value = formattedValue;
        });
    }

    function bindClientEvents(div) {
        const nameInput = div.querySelector('input[type="text"]');
        const timeInputs = div.querySelectorAll('.time-input');
        const sendTimeCheckbox = div.querySelector('.send-time-checkbox');
        const sendTimeField = div.querySelector('.send-time-field');
        const removeBtn = div.querySelector('.remove-btn');

        nameInput.addEventListener('input', saveFormState);
        timeInputs.forEach((input) => input.addEventListener('input', saveFormState));
        sendTimeCheckbox.addEventListener('change', () => {
            sendTimeField.classList.toggle('hidden', !sendTimeCheckbox.checked);
            saveFormState();
        });
        removeBtn.addEventListener('click', () => {
            div.remove();
            saveFormState();
            updateClientsEmptyState();
        });
    }

    function saveFormState() {
        const state = {
            serverTime: elements.serverTime.value.trim(),
            clients: Array.from(root.querySelectorAll('.client-input')).map((div) => ({
                name: div.querySelector('input[type="text"]').value.trim(),
                localTime: div.querySelector('.time-input').value.trim(),
                hasSendTime: div.querySelector('.send-time-checkbox').checked,
                sendTime: div.querySelector('.send-time-input').value.trim()
            }))
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function updateClientsEmptyState() {
        const count = elements.clientsContainer.children.length;
        elements.clientsEmptyState.classList.toggle('hidden', count > 0);
        elements.clientsCountPill.textContent = `${count} ${count === 1 ? 'cliente' : 'clientes'}`;
    }

    function restoreFormState() {
        const rawState = localStorage.getItem(STORAGE_KEY);
        if (!rawState) {
            return;
        }

        try {
            const state = JSON.parse(rawState);
            if (typeof state.serverTime === 'string') {
                elements.serverTime.value = state.serverTime;
            }

            if (Array.isArray(state.clients)) {
                state.clients.forEach((client) => addClient(client, {
                    shouldFocus: false,
                    shouldScroll: false,
                    shouldSave: false
                }));
            }

            updateClientsEmptyState();
        } catch (error) {
            console.warn('Nao foi possivel restaurar o cache do formulario.', error);
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    function focusClientCard(card, shouldScroll) {
        card.classList.add('is-new');
        const targetField = card.querySelector('.client-name') || card.querySelector('.time-input');

        if (targetField) {
            requestAnimationFrame(() => {
                targetField.focus();
                targetField.select?.();
            });
        }

        if (shouldScroll) {
            card.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }

        window.setTimeout(() => {
            card.classList.remove('is-new');
        }, 1800);
    }

    function buildPayload() {
        const serverTimeStr = elements.serverTime.value.trim();
        const serverTimeMs = parseTimeToMs(serverTimeStr, 'Horário do Servidor');

        const server = {
            id: 'server',
            name: 'Servidor',
            currentTimeMs: serverTimeMs,
            isServer: true
        };

        const clients = Array.from(root.querySelectorAll('.client-input')).map((div, index) => {
            const nameInput = div.querySelector('input[type="text"]');
            const localTimeInput = div.querySelector('.time-input');
            const hasSendTime = div.querySelector('.send-time-checkbox').checked;
            const sendTimeInput = div.querySelector('.send-time-input');
            const localTimeMs = parseTimeToMs(localTimeInput.value.trim(), `Hora Local do cliente ${index + 1}`);
            const sentAtMs = hasSendTime
                ? parseTimeToMs(sendTimeInput.value.trim(), `Hora de Envio do cliente ${index + 1}`)
                : undefined;

            if (typeof sentAtMs === 'number' && sentAtMs < localTimeMs) {
                throw new Error(`Hora de Envio do cliente ${index + 1} não pode ser menor que a Hora Local.`);
            }

            return {
                id: `client-${index}`,
                name: nameInput.value.trim() || `Cliente ${index + 1}`,
                currentTimeMs: localTimeMs,
                sentAtMs,
                isServer: false
            };
        });

        return { server, clients };
    }

    function showStatus(message, type) {
        elements.formStatus.textContent = message;
        elements.formStatus.className = `status-banner ${type}`;
    }

    function clearStatus() {
        elements.formStatus.textContent = '';
        elements.formStatus.className = 'status-banner hidden';
    }

    function setBusyState(isBusy) {
        elements.syncBtn.disabled = isBusy;
        elements.syncBtn.textContent = isBusy ? 'Sincronizando...' : 'Sincronizar relógios';
    }

    return elements;
}

function renderBootstrapError(root, message) {
    const formStatus = root.getElementById('formStatus');

    if (formStatus) {
        formStatus.textContent = message;
        formStatus.className = 'status-banner error';
        return;
    }

    const fallback = root.createElement('div');
    fallback.className = 'status-banner error';
    fallback.textContent = message;
    root.body.prepend(fallback);
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            initializeApp(document);
        } catch (error) {
            console.error('Erro ao inicializar a interface:', error);
            renderBootstrapError(document, getUserFacingErrorMessage(error));
        }
    });
}
