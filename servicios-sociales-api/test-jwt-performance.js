const http = require('http');
const https = require('https');

// Configura la URL base de tu API según si estás en local (localhost:3001) o en AWS
const API_URL = 'http://localhost:3001/api';
const TEST_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZTQ0YWQzYy04ZWM4LTRkNmUtYjNjOS02NjAwNzY3ZTVhY2QiLCJlbWFpbCI6IjI5MTYzOTIwMTlAbWFpbC51dGVjLmVkdS5zdiIsInJvbGVzIjpbImNpdGl6ZW4iXSwidHlwZSI6ImNpdGl6ZW4iLCJpYXQiOjE3NzcwODM0MzgsImV4cCI6MTc3NzA4NDMzOH0.hTmZ0kuEl5cpQ8kXUcTCPhVDQCYJC-Ev5zYZaSutUTfE3PzbS-8g9a1LDwAsreYRsiKiaTCV_Kh4V5JPWRtwGvhxzc9llyj5v_IEVXVFjomYT_BkWSRaOnSCierO6tPzIwC3dKHESZAWYWRvXz9cfhG1lzZHLQS9i4X41APZAFeq9Zp5ZYQi_TmS_KviGxtU8rbrfP5Cw_sYJ-2vGbJkKNrOXJ-r9su2CrTQgarMjymHaZMrKuZkeVIUY5rL3Y5PXQ_spW-9B0KabhY4m6Ft0xmM06rZSrrN_0NhVaBQmA3dl_2G2me0AWPNKfESmspgPAepEHcv-gFAKRY4sd36MQ';

async function measureRequest() {
  const start = performance.now();

  return new Promise((resolve) => {
    http.get(`${API_URL}/affiliation/me`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    }, (res) => {
      // Ignorar el cuerpo, solo nos importa el tiempo de respuesta
      res.on('data', () => { });
      res.on('end', () => {
        const end = performance.now();
        resolve({
          status: res.statusCode,
          timeMs: end - start
        });
      });
    }).on('error', (err) => {
      console.error('Error:', err.message);
      resolve(null);
    });
  });
}

async function runBenchmark() {
  console.log('--- INICIANDO BENCHMARK DE JWT (RS256) ---\n');
  console.log('Realizando 100 pruebas de tiempo de respuesta (incluye validación del token)...\n');

  let totalTime = 0;
  let successCount = 0;
  let maxTime = 0;
  let minTime = 999999;

  // Realizar las pruebas en ráfaga (simulando carga)
  for (let i = 1; i <= 100; i++) {
    const result = await measureRequest();
    if (result && (result.status === 200 || result.status === 403 || result.status === 401)) {
      // Aún si es 403 o 401, el filtro de JWT y OPA ya procesaron la data.
      const time = result.timeMs;
      totalTime += time;

      if (time > maxTime) maxTime = time;
      if (time < minTime) minTime = time;

      successCount++;
      process.stdout.write(`Req ${i}: ${time.toFixed(2)}ms | `);
      if (i % 5 === 0) console.log('');
    }
  }

  const avgTime = totalTime / successCount;

  console.log('\n--- RESULTADOS DEL BENCHMARK ---');
  console.log(`Peticiones Exitosas: ${successCount} / 100`);
  console.log(`Tiempo Mínimo:       ${minTime.toFixed(2)} ms`);
  console.log(`Tiempo Máximo:       ${maxTime.toFixed(2)} ms`);
  console.log(`Tiempo Promedio:     ${avgTime.toFixed(2)} ms`);

  if (avgTime < 50) {
    console.log('\n OBJETIVO CUMPLIDO: La validación JWT RS256 toma menos de 50ms!');
  } else {
    console.log('\nOBJETIVO NO CUMPLIDO: El promedio es mayor a 50ms.');
  }
}

runBenchmark();
