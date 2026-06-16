# WebWiz Quiz Android

Esta app usa Capacitor para empaquetar la SPA React/Vite como Android nativo.

## Identidad Android

- App name: `WebWiz Quiz`
- Application ID: `com.orpira.webwizquiz`
- Deep link OAuth: `webwizquiz://auth/callback`
- Web redirect OAuth: `https://orpira.es/auth/callback`

## Supabase Auth

En Supabase Dashboard > Authentication > URL Configuration:

- Site URL: `https://orpira.es`
- Redirect URLs:
  - `https://orpira.es/auth/callback`
  - `https://www.orpira.es/auth/callback`
  - `webwizquiz://auth/callback`

En los proveedores OAuth:

- Google Console > OAuth Client > Authorized redirect URI:
  - `https://<tu-proyecto>.supabase.co/auth/v1/callback`
- GitHub OAuth App > Authorization callback URL:
  - `https://<tu-proyecto>.supabase.co/auth/v1/callback`

Supabase recibe primero el callback del proveedor y después redirige a la URL
configurada por la app. En Android esa URL es el deep link `webwizquiz://auth/callback`.

## Variables de entorno

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_AUTH_REDIRECT_URL=https://orpira.es
VITE_MOBILE_AUTH_REDIRECT_URL=webwizquiz://auth/callback
```

## Comandos

```bash
npm run build:web
npm run cap:sync
npm run android:apk
npm run android:apk:release
npm run android:aab
npm run android:open
```

Salidas generadas:

- APK debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- APK release sin keystore: `android/app/build/outputs/apk/release/app-release-unsigned.apk`
- AAB release: `android/app/build/outputs/bundle/release/app-release.aab`

## Firma release

Genera una keystore privada fuera del control de versiones:

```bash
keytool -genkeypair -v \
  -keystore android/release-key.jks \
  -alias webwizquiz \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Copia `android/keystore.properties.example` a `android/keystore.properties` y completa las credenciales reales:

```properties
storeFile=../release-key.jks
storePassword=...
keyAlias=webwizquiz
keyPassword=...
```

`android/keystore.properties`, `*.jks` y `*.keystore` están ignorados por Git.

## Checklist Google Play

- Crear app en Google Play Console con package name `com.orpira.webwizquiz`.
- Configurar App Signing by Google Play.
- Subir `app-release.aab` firmado con la keystore de subida.
- Completar ficha: nombre, descripción, icono 512x512, feature graphic y capturas.
- Completar Data Safety: Supabase Auth, email, perfil OAuth y datos de uso que guardes.
- Publicar Privacy Policy en una URL pública.
- Configurar clasificación de contenido.
- Configurar público objetivo y ads.
- Probar OAuth Google/GitHub en Internal Testing antes de producción.
- Verificar que `webwizquiz://auth/callback` está en Supabase Redirect URLs.
- Incrementar `versionCode` y `versionName` en `android/app/build.gradle` antes de cada release.

## Notas de compatibilidad

- OAuth usa PKCE y abre Chrome Custom Tabs mediante `@capacitor/browser`; la sesión se completa al recibir `appUrlOpen`.
- Login por email no requiere deep link y sigue usando `signInWithPassword`.
- No se esperan problemas de CORS contra Supabase: la app Android hace peticiones HTTPS normales desde WebView. El punto crítico es la allowlist de Redirect URLs en Supabase.
- El formulario externo `formsubmit.co` depende de conectividad y políticas del servicio externo igual que en web.
- Vite avisa de un chunk superior a 500 kB. No bloquea Android, pero conviene dividir rutas pesadas con `lazy()` si el arranque móvil se vuelve lento.
