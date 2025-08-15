import { check, sleep } from "k6";
import http from "k6/http";

export const options = {
  vus: 100,
  duration: "1m"
};

export default function() {
  const response = http.get("https://dev-api.acexr.com/platform-services/v2/users/me");
  check(response, { "status is 200": (r) => r.status === 200 });
  sleep(1);
}
