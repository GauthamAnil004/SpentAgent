// Light smoke load test against the live SpendAgent backend (Render free
// tier). Deliberately small: 5 virtual users for ~30s, hitting read-only
// GET endpoints only (no writes), just to confirm the API holds up under
// light concurrent traffic without hammering a production, free-tier
// service.
//
// Run in CI via the grafana/k6-action in
// .github/workflows/backend-checks.yml, or locally with:
//   k6 run load-tests/smoke-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://spentagent-api.onrender.com';

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<5000'],
  },
};

export default function () {
  const health = http.get(`${BASE_URL}/`);
  check(health, {
    'health check status is 200': (r) => r.status === 200,
  });

  const expenses = http.get(`${BASE_URL}/api/personal/expenses`);
  check(expenses, {
    'expenses endpoint status is 200': (r) => r.status === 200,
  });

  const ledger = http.get(`${BASE_URL}/api/ledger/records`);
  check(ledger, {
    'ledger endpoint status is 200': (r) => r.status === 200,
  });

  sleep(1);
}

