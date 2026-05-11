import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-ignore Browser-side module imported for shared helper coverage.
import { getUserFacingErrorMessage, msToTimeString, parseTimeToMs, renderSyncResults } from '../../public/script.js';

test('getUserFacingErrorMessage hides raw null-property errors from the user', () => {
  const message = getUserFacingErrorMessage(
    new TypeError("Cannot set properties of null (setting 'textContent')")
  );

  assert.equal(
    message,
    'A interface ficou inconsistente depois da última alteração. Recarregue a página e tente novamente.'
  );
});

test('getUserFacingErrorMessage preserves domain validation messages', () => {
  const message = getUserFacingErrorMessage(
    new Error('Hora de Envio do cliente 1 não pode ser menor que a Hora Local.')
  );

  assert.equal(message, 'Hora de Envio do cliente 1 não pode ser menor que a Hora Local.');
});

test('parseTimeToMs parses valid time strings', () => {
  assert.equal(parseTimeToMs('01:02:03', 'Campo'), 3_723_000);
});

test('msToTimeString normalizes negative values into the same day', () => {
  assert.equal(msToTimeString(-1_000), '23:59:59');
});

test('renderSyncResults works even when heroClockValue is absent', () => {
  let resultsSectionHidden = true;

  const view = {
    resultsSection: {
      classList: {
        remove(className: string) {
          if (className === 'hidden') {
            resultsSectionHidden = false;
          }
        }
      }
    },
    globalClockValue: { textContent: '' },
    heroClockValue: null,
    statClientsCount: { textContent: '' },
    statFirstSend: { textContent: '' },
    statLastAdjustedSend: { textContent: '' },
    tableAdjustments: { innerHTML: '' },
    tableRankingBefore: { innerHTML: '' },
    tableRankingAfter: { innerHTML: '' }
  };

  renderSyncResults(view, {
    results: [
      {
        id: 'server',
        name: 'Servidor',
        originalTimeMs: 10_000,
        adjustmentMs: 1_000,
        synchronizedTimeMs: 11_000,
        isServer: true
      },
      {
        id: 'client-1',
        name: 'Cliente 1',
        originalTimeMs: 9_000,
        sendTimeMs: 10_000,
        adjustmentMs: 2_000,
        synchronizedTimeMs: 11_000,
        synchronizedSendTimeMs: 12_000,
        isServer: false
      }
    ],
    rankingBefore: [
      {
        id: 'client-1',
        name: 'Cliente 1',
        originalTimeMs: 9_000,
        sendTimeMs: 10_000,
        adjustmentMs: 2_000,
        synchronizedTimeMs: 11_000,
        synchronizedSendTimeMs: 12_000,
        isServer: false
      }
    ],
    rankingAfter: [
      {
        id: 'client-1',
        name: 'Cliente 1',
        originalTimeMs: 9_000,
        sendTimeMs: 10_000,
        adjustmentMs: 2_000,
        synchronizedTimeMs: 11_000,
        synchronizedSendTimeMs: 12_000,
        isServer: false
      }
    ]
  });

  assert.equal(resultsSectionHidden, false);
  assert.equal(view.globalClockValue.textContent, '00:00:11');
  assert.equal(view.statClientsCount.textContent, '1');
  assert.match(view.tableAdjustments.innerHTML, /Cliente 1/);
  assert.match(view.tableRankingAfter.innerHTML, /00:00:12/);
});
