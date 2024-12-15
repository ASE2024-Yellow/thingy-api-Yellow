import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 }, // Ramp up to 10 users over 1 minute
  ],
};

const BASE_URL = 'http://localhost:3000';

const generateRandomId = (length) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const generateUserData = () => ({
  username: `user_${generateRandomId(5)}`,
  email: `user_${generateRandomId(5)}@example.com`,
  password: 'password123',
  transportType: 'bike',
});

export default function () {
  // Login and token generation
  const userPayload = generateUserData();
  const signupRes = http.post(`${BASE_URL}/user/signup`, JSON.stringify(userPayload), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(signupRes, { 'Signup status is 201': (r) => r.status === 201 });

  const loginRes = http.post(
    `${BASE_URL}/user/signin`,
    JSON.stringify({ username: userPayload.username, password: userPayload.password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'Login status is 200': (r) => r.status === 200,
    'Token exists': (r) => !!r.json('token'),
  });

  const token = loginRes.json('token');
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // Thingy API Tests
  const thingyId = 'yellow-2'; // Replace with an actual Thingy ID

  // Test Get Flip History
  const flipHistoryRes = http.get(`${BASE_URL}/things/flips`, authHeaders);
  check(flipHistoryRes, {
    'Flip history status is 200': (r) => r.status === 200,
    'Flip history is an array': (r) => Array.isArray(r.json()),
  });

  // Test Get Button History
  const buttonHistoryRes = http.get(`${BASE_URL}/things/buttons`, authHeaders);
  check(buttonHistoryRes, {
    'Button history status is 200': (r) => r.status === 200,
    'Button history is an array': (r) => Array.isArray(r.json()),
  });

  // Test Get Sensor Statistics
  const sensorTypes = ['TEMP', 'HUMID', 'AIR_PRESS', 'AIR_QUAL', 'CO2_EQUIV', 'LIGHT'];
  const statistics = ['min', 'max', 'average'];
  const startTime = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hour ago
  const endTime = new Date().toISOString();

  sensorTypes.forEach((sensor) => {
    statistics.forEach((stat) => {
      const sensorStatRes = http.get(
        `${BASE_URL}/things/sensorData/${sensor}/statistics/${stat}?startTime=${startTime}&endTime=${endTime}`,
        authHeaders
      );
      check(sensorStatRes, {
        [`Get ${sensor} ${stat} status is 200`]: (r) => r.status === 200,
        [`Get ${sensor} ${stat} response has value`]: (r) => r.json('value') !== undefined,
      });
    });
  });

  sleep(1); // Simulate user pacing
}
