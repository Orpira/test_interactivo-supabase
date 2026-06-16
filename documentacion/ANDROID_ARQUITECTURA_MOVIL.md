# WebWiz Quiz - Arquitectura Movil Android

Fecha de validacion: 2026-06-16

## Estado actual

WebWiz Quiz ya queda preparada como aplicacion Android con Capacitor sobre una base React, Vite, TypeScript, Tailwind CSS y Supabase. La Fase 1 esta operativa: el proyecto Android existe, el deep link de OAuth esta declarado, los assets nativos estan generados y los artefactos Android compilan.

## Arquitectura propuesta

La app debe evolucionar como una aplicacion mobile-first con una capa nativa fina y una capa de dominio desacoplada:

```txt
src/
  app/                         # bootstrap futuro, providers globales y app shell
  platform/
    capacitor/                 # adaptadores nativos: auth callbacks, push, network, storage
    web/                       # adaptadores web equivalentes
  features/
    auth/                      # login, sesion, perfil y conversion de invitados
    dashboard/                 # ranking personal/global, actividad e historial
    quiz/                      # ejecucion online/offline
    challenges/                # retos, invitaciones y participacion
    ai-quiz/                   # generacion asistida por IA
    gamification/              # logros, insignias, niveles y retos semanales
  services/
    supabase.ts                # cliente Supabase
    auth.tsx                   # estado de auth y OAuth movil
  store/                       # estado cliente por feature
  storage/                     # cache local, repositorios offline y cola de sincronizacion
  sync/                        # motor de sincronizacion y resolucion de conflictos
  types/                       # contratos compartidos
```

El principio clave es que React no debe depender directamente de plugins nativos fuera de adaptadores pequenos. Las features consumen puertos de dominio como `QuizRepository`, `InvitationRepository`, `OfflineQueue` o `NotificationService`; cada puerto tendra implementacion web, Android y de test.

## Fase 1 implementada

Identidad Android:

- Nombre: `WebWiz Quiz`.
- Application ID: `com.orpira.webwizquiz`.
- Deep link OAuth: `webwizquiz://auth/callback`.
- Web dir: `dist`.
- Android scheme interno de Capacitor: `https`.

Archivos principales:

- `capacitor.config.ts`: app id, app name, webDir, scheme y Splash Screen.
- `android/app/src/main/AndroidManifest.xml`: actividad principal, `singleTask`, permiso `INTERNET` e intent-filter de deep link.
- `android/app/src/main/res/values/strings.xml`: nombre, package y scheme.
- `android/app/build.gradle`: configuracion Android, versionado, firma release opcional y google-services para FCM futuro.
- `resources/icon.png` y `resources/splash.png`: fuentes de assets nativos.
- `src/services/auth.tsx`: OAuth PKCE, Chrome Custom Tabs y callback nativo con `App.addListener("appUrlOpen")`.
- `src/services/authRedirect.ts`: seleccion de redirect URL web o movil.
- `src/services/supabase.ts`: cliente Supabase con PKCE, persistencia y refresh automatico.

Comandos disponibles:

```bash
npm run build
npm run android:assets
npm run cap:sync
npm run android:apk
npm run android:apk:release
npm run android:aab
npm run android:verify
npm run android:open
```

Artefactos generados y validados:

```txt
android/app/build/outputs/apk/debug/app-debug.apk
android/app/build/outputs/apk/release/app-release-unsigned.apk
android/app/build/outputs/bundle/release/app-release.aab
```

## OAuth movil con Supabase

Supabase Auth debe configurarse asi:

```txt
Site URL:
https://orpira.es

Redirect URLs:
https://orpira.es/auth/callback
https://www.orpira.es/auth/callback
webwizquiz://auth/callback
```

Google y GitHub no deben apuntar al deep link directamente. Ambos proveedores deben usar el callback de Supabase:

```txt
https://<project-ref>.supabase.co/auth/v1/callback
```

Flujo Android:

1. React solicita OAuth con `redirectTo=webwizquiz://auth/callback`.
2. Supabase genera flujo PKCE.
3. Android abre el proveedor con `@capacitor/browser`.
4. El proveedor vuelve a Supabase.
5. Supabase redirige a `webwizquiz://auth/callback?code=...`.
6. Android captura el deep link en `appUrlOpen`.
7. La app ejecuta `supabase.auth.exchangeCodeForSession(code)`.
8. La sesion queda persistida y con refresh automatico.

Login por email:

- Sigue usando `supabase.auth.signInWithPassword`.
- No requiere deep link.
- Debe mostrar errores traducidos antes de publicar en Play Store.

## Preparacion de firma release

Generar keystore fuera de Git:

```bash
keytool -genkeypair -v \
  -keystore android/release-key.jks \
  -alias webwizquiz \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Crear `android/keystore.properties` desde `android/keystore.properties.example`:

```properties
storeFile=../release-key.jks
storePassword=...
keyAlias=webwizquiz
keyPassword=...
```

Para Google Play se debe subir el AAB firmado. El APK release sin keystore es util para validacion tecnica, pero no para publicacion.

## Fase 2 - Hoja de ruta tecnica

### A. Notificaciones Push

Dependencias recomendadas:

```bash
npm install @capacitor/push-notifications @capacitor/preferences
npx cap sync android
```

Arquitectura:

- Firebase Cloud Messaging para entrega.
- Supabase `device_tokens` para registrar token por usuario/dispositivo.
- Supabase Edge Functions para emitir notificaciones desde eventos de negocio.
- Tablas/eventos: invitacion recibida, reto nuevo, resultado publicado, cambio de ranking.
- Opt-in explicito desde la app y panel para desactivar categorias de notificacion.

Tablas sugeridas:

```sql
create table device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  platform text not null check (platform in ('android', 'web')),
  token text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);
```

### B. Dashboard movil optimizado

Pantallas:

- Resumen: ranking personal, racha, nivel, puntos y ultimo resultado.
- Ranking global: filtros por categoria, nivel y periodo.
- Historial: resultados recientes con reintento rapido.
- Mis quizzes: creados, borradores, publicados.
- Invitaciones: recibidas, pendientes, aceptadas y expiradas.

Patron UI:

- Navegacion inferior en Android: Inicio, Quizzes, Ranking, Invitaciones, Perfil.
- Carga por secciones con skeletons.
- Datos agregados en vistas SQL o RPC para reducir llamadas desde movil.

### C. Cache offline

Recomendacion:

- `IndexedDB` mediante Dexie para datos relacionales cliente.
- `@capacitor/preferences` solo para flags pequenos, version de cache y preferencias.
- `@capacitor/network` para estado de conexion.

Datos cacheables:

- Quizzes descargados.
- Preguntas y respuestas permitidas.
- Historial reciente.
- Perfil resumido.
- Invitaciones pendientes de abrir.

Reglas:

- Cada registro cacheado debe tener `server_updated_at`, `local_updated_at` y `sync_status`.
- El contenido descargado debe versionarse por `quiz_version`.
- No cachear secretos ni claves de servicio.

### D. Modo practica offline

Flujo:

1. Usuario descarga un quiz.
2. La app guarda snapshot inmutable de preguntas y respuestas.
3. Usuario resuelve offline.
4. Resultado queda en `offline_attempts` con UUID cliente.
5. Al volver la conexion, la cola sincroniza con Supabase.
6. Supabase valida que el quiz/version existen y que el intento no fue enviado antes.

Tabla sugerida:

```sql
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  client_attempt_id uuid not null,
  user_id uuid references auth.users(id) on delete cascade,
  quiz_id uuid not null,
  quiz_version integer not null,
  score integer not null,
  max_score integer not null,
  answers jsonb not null,
  completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, client_attempt_id)
);
```

Seguridad:

- RLS por `auth.uid() = user_id`.
- RPC `submit_quiz_attempt` para validar score en servidor cuando el quiz no sea de practica libre.
- Idempotencia con `client_attempt_id`.

### E. Generacion de quizzes mediante IA

Arquitectura:

- La app nunca llama al proveedor IA directamente.
- Usar Supabase Edge Function `generate_quiz`.
- Validar cuota, usuario, categoria, nivel y numero de preguntas en servidor.
- Guardar borrador editable antes de publicar.

Estados:

- `draft`: generado y editable.
- `reviewed`: revisado por creador.
- `published`: disponible para jugar/invitar.
- `archived`: oculto.

### F. Sistema de invitaciones

Modalidades:

- Enlace: `https://orpira.es/invite/<code>`.
- Codigo corto: 6-8 caracteres no ambiguos.
- Invitacion directa a usuario registrado.
- Invitado anonimo con `guest_session_id`.
- Conversion de invitado a usuario manteniendo historial.

Tablas:

- `quiz_invitations`: quiz, creador, destinatario opcional, codigo, expiracion y estado.
- `guest_sessions`: id local, dispositivo, fecha y estado de conversion.
- `guest_attempt_links`: relacion entre intentos anonimos y usuario convertido.

### G. Gamificacion

Modelo:

- `achievements`: catalogo de logros.
- `user_achievements`: logros desbloqueados.
- `badges`: insignias visuales.
- `user_xp_events`: eventos de puntos.
- `weekly_challenges`: retos semanales.
- `user_levels`: vista o calculo por XP acumulada.

Regla de oro: los puntos y logros deben calcularse o confirmarse en servidor para evitar manipulacion local.

## Riesgos tecnicos

- OAuth movil depende de que Supabase tenga `webwizquiz://auth/callback` en la allowlist.
- Google/GitHub fallaran si los proveedores apuntan al deep link en vez del callback de Supabase.
- El AAB de publicacion requiere keystore real; sin ella solo se genera artefacto unsigned.
- El bundle web principal supera 1 MB minificado. Conviene aplicar lazy loading por rutas antes de crecer mas.
- Offline introduce conflicto de datos: hay que usar idempotencia, timestamps y RPCs de sincronizacion.
- Push requiere politica de privacidad y declaracion de recogida/uso de datos en Google Play.
- IA requiere control de coste, rate limiting, auditoria y moderacion del contenido generado.

## Recomendaciones de escalabilidad

- Separar rutas pesadas con `React.lazy` y `Suspense`.
- Migrar consultas complejas a vistas/RPC de Supabase para reducir payload movil.
- Definir contratos TypeScript generados desde Supabase cuando el esquema se estabilice.
- Incorporar observabilidad: Sentry para errores cliente y logs en Edge Functions.
- Mantener RLS estricta y cubrir invitaciones/offline con pruebas SQL.
- Usar feature flags para activar push, offline e IA de forma gradual.
- Automatizar builds con GitHub Actions: lint, test, build web, `cap sync`, APK debug y AAB release firmado.

## Checklist Google Play

- Reservar package name `com.orpira.webwizquiz`.
- Configurar Play App Signing.
- Crear keystore de subida y guardar backup seguro.
- Firmar `app-release.aab`.
- Incrementar `versionCode` y `versionName`.
- Probar OAuth Google, GitHub y email en Internal Testing.
- Verificar deep link con `adb shell am start -W -a android.intent.action.VIEW -d "webwizquiz://auth/callback?code=test" com.orpira.webwizquiz`.
- Completar ficha, icono 512x512, feature graphic y capturas.
- Publicar Privacy Policy.
- Completar Data Safety: auth, email, perfil, resultados, rankings, push tokens y analitica si se agrega.
- Configurar clasificacion de contenido.
- Configurar publico objetivo.
- Declarar permisos y finalidad de notificaciones.
- Probar instalacion limpia, actualizacion y cierre/apertura de sesion.

## Roadmap 12 meses

Meses 1-2:

- Publicar beta interna Android.
- Corregir UX movil del login, dashboard y navegacion.
- Lazy loading de rutas y medicion de performance.
- Pruebas en dispositivos Android reales.

Meses 3-4:

- Push notifications con FCM.
- Registro y preferencias de tokens.
- Eventos de invitaciones y resultados.

Meses 5-6:

- Cache offline de quizzes e historial.
- IndexedDB/Dexie y motor de cola.
- Pantalla de descargas.

Meses 7-8:

- Modo practica offline.
- RPC segura de sincronizacion.
- Reintentos, idempotencia y resolucion de conflictos.

Meses 9-10:

- Generacion de quizzes con IA via Edge Functions.
- Vista previa editable y moderacion.
- Cuotas por usuario/plan.

Meses 11-12:

- Invitaciones avanzadas, invitados anonimos y conversion.
- Gamificacion completa.
- Preparacion de lanzamiento publico en Google Play con observabilidad y CI/CD.
