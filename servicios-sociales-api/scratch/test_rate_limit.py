import requests
import time

# URL de tu API (Cámbiala a la de AWS si quieres probar allá, o usa localhost)
# BASE_URL = "http://api-load-balancer-1751329211.us-east-1.elb.amazonaws.com"
BASE_URL = "http://localhost:3001"
ENDPOINT = f"{BASE_URL}/api/auth/citizen/login"

print(f"Enviando peticiones secuenciales a {ENDPOINT}...")
start_time = time.time()

results = []
for i in range(150):
    payload = {
        "email": "2916392019@mail.utec.edu.sv",
        "password": "Cotizante123!"
    }
    try:
        response = requests.post(ENDPOINT, json=payload, timeout=5)
        status = response.status_code
        print(f"Request {i+1:03d} | Status: {status} | Remaining: {response.headers.get('X-RateLimit-Remaining', 'N/A')}")
        results.append(status)
        
        # Rompe en el primer 429 para que solo asigne 1 strike por ejecución
        if status == 429:
            print("\n¡Rate limit alcanzado (429)! Deteniendo script para evitar múltiples strikes de golpe.")
            break
        elif status == 403:
            print("\n¡Servidor devolvió 403! Tu IP ya está baneada de forma permanente.")
            break

    except Exception as e:
        print(f"Error in request {i+1}: {e}")
        break

end_time = time.time()

success = sum(1 for r in results if r in [200, 201, 400, 401])
blocked = results.count(429)
banned = results.count(403)

print("-" * 50)
print(f"Pruebas finalizadas en {end_time - start_time:.2f} segundos")
print(f"Peticiones enviadas: {len(results)}")
print(f"Peticiones procesadas: {success}")
print(f"Peticiones BLOQUEADAS (429 - Strikes temporales): {blocked}")
print(f"Peticiones BANEADAS (403 - Baneo permanente): {banned}")
print("-" * 50)

if blocked > 0:
    print("¡Éxito! El sistema te bloqueó y te ha sumado solo 1 Strike.")
elif banned > 0:
    print("Estás baneado de forma definitiva.")
else:
    print("El servidor no bloqueó ninguna petición.")
