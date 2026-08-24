import { createClient } from '@neondatabase/neon-js';

const client = createClient({
  auth: {
    url: 'https://ep-silent-dawn-awkb9bqv.neonauth.c-12.us-east-1.aws.neon.tech/neondb/auth'
  },
  dataApi: {
    url: 'https://ep-silent-dawn-awkb9bqv.apirest.c-12.us-east-1.aws.neon.tech/neondb/rest/v1'
  }
});

window.neonClient = client;
window.__resolveNeon?.(client);
