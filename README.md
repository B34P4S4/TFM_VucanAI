# Analizador de vulnerabilidades de código con IA - Code Vulnerability Analyzer with AI  
# Nombre: VucanAI
# Autor: B34P4S4

VucanAI es una aplicación que utiliza el modelo ChatGPT 3.5 Turbo para analizar el código y detectar posibles vulnerabilidades de seguridad. La aplicación está desarrollada con Node.js en el backend y React.js en el frontend. Ofrece un dashboard que mapea distintas fuentes descriptivas de la vulnerabilidad detectada y ofrece recomendaciones para mitigar el riesgo que conlleve.

## Características

- Análisis de código en varios lenguajes de programación (Java, #C, Perl).
- Detección de vulnerabilidades comunes como inyección SQL, XSS, Overflows, entre otras.
- Interfaz de usuario intuitiva y fácil de usar.
- En español e inglés.
- Resultados gráficos detallados y recomendaciones para solucionar las vulnerabilidades detectadas.
- Basada en ChatGPT 3.5 Turbo

## Requisitos

- Node.js (versión 14 o superior)
- npm (versión 6 o superior)

## Instalación

1. Si no tienes Node.js, instala desde [nodejs.org](https://nodejs.org/en/) (Node.js version >= 16.0.0 requerida)

2. Clona el repositorio:

   ```bash
   git clone https://github.com/B34P4S4/TFM_VucanAI.git

3. Navega al directorio del proyecto

   ```bash
   $ cd TFM_VucanAI
   ```

4. Instalación previa

   ```bash
   $ npm install
   ```

5. Haz una copia del archivo env

   On Linux systems: 
   ```bash
   $ cp .env.example .env
   ```
   On Windows:
   ```powershell
   $ copy .env.example .env
   ```
6. Añade tu clave [API](https://platform.openai.com/account/api-keys) en el nuevo archivo `.env` 

7. Lanza la aplicación

   ```bash
   $ npm run dev
   ```

[IMPORTANTE!] Debes tener acceso al puerto 3000 [http://localhost:3000]


## Contribuir

¡Las contribuciones son bienvenidas! Si deseas contribuir, por favor sigue estos pasos:

   Haz un fork del repositorio.
   Crea una nueva rama (git checkout -b feature-nueva-funcionalidad).
   Realiza tus cambios y haz commit (git commit -am 'Agrega nueva funcionalidad').
   Envía tus cambios a la rama principal (git push origin feature-nueva-funcionalidad).
   Abre un pull request.