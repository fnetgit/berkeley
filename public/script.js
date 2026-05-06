document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'berkeley-form-state-v1';
    const clientsContainer = document.getElementById('clientsContainer');
    const clientsEmptyState = document.getElementById('clientsEmptyState');
    const addClientBtn = document.getElementById('addClientBtn');
    const syncBtn = document.getElementById('syncBtn');
    const resultsSection = document.getElementById('resultsSection');
    const formStatus = document.getElementById('formStatus');
    const heroClockValue = document.getElementById('heroClockValue');

    addClientBtn.addEventListener('click', addClient);
    document.querySelectorAll('.time-input').forEach(applyTimeMask);
    restoreFormState();
    updateClientsEmptyState();

    document.getElementById('serverTime').addEventListener('input', saveFormState);

    syncBtn.addEventListener('click', async () => {
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
                throw new Error('Falha ao sincronizar os relogios.');
            }

            const data = await response.json();
            displayResults(data, payload);
            showStatus('Sincronização concluída com sucesso.', 'success');
        } catch (error) {
            console.error('Erro ao sincronizar:', error);
            showStatus(error.message || 'Erro ao conectar com o servidor.', 'error');
        } finally {
            setBusyState(false);
        }
    });

    function addClient(clientData = {}) {
        const currentClients = clientsContainer.querySelectorAll('.client-input').length;
        const clientName = clientData.name || `Cliente ${currentClients + 1}`;
        const localTime = clientData.localTime || '';
        const hasSendTime = Boolean(clientData.hasSendTime);
        const sendTime = clientData.sendTime || '';
        const div = document.createElement('div');
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
        clientsContainer.appendChild(div);
        div.querySelectorAll('.time-input').forEach(applyTimeMask);
        bindClientEvents(div);
        saveFormState();
        updateClientsEmptyState();
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
            serverTime: document.getElementById('serverTime').value.trim(),
            clients: Array.from(document.querySelectorAll('.client-input')).map((div) => ({
                name: div.querySelector('input[type="text"]').value.trim(),
                localTime: div.querySelector('.time-input').value.trim(),
                hasSendTime: div.querySelector('.send-time-checkbox').checked,
                sendTime: div.querySelector('.send-time-input').value.trim()
            }))
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function updateClientsEmptyState() {
        clientsEmptyState.classList.toggle('hidden', clientsContainer.children.length > 0);
    }

    function restoreFormState() {
        const rawState = localStorage.getItem(STORAGE_KEY);
        if (!rawState) {
            return;
        }

        try {
            const state = JSON.parse(rawState);
            if (typeof state.serverTime === 'string') {
                document.getElementById('serverTime').value = state.serverTime;
            }

            if (Array.isArray(state.clients)) {
                state.clients.forEach((client) => addClient(client));
            }
        } catch (error) {
            console.warn('Nao foi possivel restaurar o cache do formulario.', error);
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function buildPayload() {
        const serverTimeStr = document.getElementById('serverTime').value.trim();
        const serverTimeMs = parseTimeToMs(serverTimeStr, 'Horário do Servidor');

        const server = {
            id: 'server',
            name: 'Servidor',
            currentTimeMs: serverTimeMs,
            isServer: true
        };

        const clients = Array.from(document.querySelectorAll('.client-input')).map((div, index) => {
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

    function parseTimeToMs(timeStr, fieldLabel) {
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

    function msToTimeString(ms) {
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

    function formatAdjustment(ms) {
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

    function displayResults(data, payload) {
        if (!data.results || data.results.length === 0) {
            throw new Error('Resposta sem resultados de sincronizacao.');
        }

        resultsSection.classList.remove('hidden');

        const globalTimeMs = data.results[0].synchronizedTimeMs;
        document.getElementById('globalClockValue').textContent = msToTimeString(globalTimeMs);
        heroClockValue.textContent = msToTimeString(globalTimeMs);

        const clientResults = data.results.filter((res) => !res.isServer);
        const rankings = buildClientRankings(clientResults, payload.clients);
        const firstSend = rankings.before.find((item) => Number.isFinite(item.sendTimeMs));
        const lastAdjusted = [...rankings.after].reverse().find((item) => Number.isFinite(item.synchronizedSendTimeMs));

        document.getElementById('statClientsCount').textContent = String(clientResults.length);
        document.getElementById('statFirstSend').textContent = formatRankingTime(firstSend?.sendTimeMs);
        document.getElementById('statLastAdjustedSend').textContent = formatRankingTime(lastAdjusted?.synchronizedSendTimeMs);

        const tableAdjustments = document.querySelector('#tableAdjustments tbody');
        tableAdjustments.innerHTML = clientResults.map((res) => `
            <tr>
                <td>${res.name}</td>
                <td>${formatAdjustment(res.adjustmentMs)}</td>
                <td>${msToTimeString(res.synchronizedTimeMs)}</td>
            </tr>
        `).join('');

        renderRankingTable(
            document.querySelector('#tableRankingBefore tbody'),
            rankings.before,
            (res) => res.sendTimeMs
        );
        renderRankingTable(
            document.querySelector('#tableRankingAfter tbody'),
            rankings.after,
            (res) => res.synchronizedSendTimeMs
        );
    }

    function buildClientRankings(clientResults, clientsPayload) {
        const payloadById = new Map(clientsPayload.map((client) => [client.id, client]));
        const merged = clientResults.map((res) => {
            const client = payloadById.get(res.id);
            const sendTimeMs = client?.sentAtMs;
            return {
                ...res,
                sendTimeMs,
                synchronizedSendTimeMs: Number.isFinite(sendTimeMs) ? sendTimeMs + res.adjustmentMs : null
            };
        });

        return {
            before: [...merged].sort((a, b) => compareOptionalTimes(a.sendTimeMs, b.sendTimeMs)),
            after: [...merged].sort((a, b) => compareOptionalTimes(a.synchronizedSendTimeMs, b.synchronizedSendTimeMs))
        };
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

    function formatRankingTime(ms) {
        if (!Number.isFinite(ms)) {
            return '--:--:--';
        }

        return msToTimeString(ms);
    }

    function compareOptionalTimes(a, b) {
        const left = Number.isFinite(a) ? a : Number.POSITIVE_INFINITY;
        const right = Number.isFinite(b) ? b : Number.POSITIVE_INFINITY;
        return left - right;
    }

    function showStatus(message, type) {
        formStatus.textContent = message;
        formStatus.className = `status-banner ${type}`;
    }

    function clearStatus() {
        formStatus.textContent = '';
        formStatus.className = 'status-banner hidden';
    }

    function setBusyState(isBusy) {
        syncBtn.disabled = isBusy;
        syncBtn.textContent = isBusy ? 'Sincronizando...' : 'Sincronizar relógios';
    }
});
