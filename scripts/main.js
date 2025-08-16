import { check, sleep } from "k6";
import http from "k6/http";

export const options = {
  vus: 30,
  duration: "30s"
};

export default function() {
  const response = http.get("https://dev-api.acexr.com/platform-services/v2/health");
  check(response, { "status is 200": (r) => r.status === 200 });
  sleep(1);
  const response2= http.get("https://dev-api.acexr.com/platform-services/v2/client-configs");
  check(response, { "status is 200": (r) => r.status === 200 });
  sleep(1)

}
