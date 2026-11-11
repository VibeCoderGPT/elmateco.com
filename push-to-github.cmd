chcp 65001 >nul
@echo off
title ELMATECO - Pousser sur GitHub
cd /d "%~dp0"

echo.
echo  ================================================
echo   ELMATECO - Envoi du site vers GitHub
echo  ================================================
echo.

git config http.sslBackend openssl
set GH=C:\Users\micha\.ghcli\bin\gh.exe
for /f "usebackq delims=" %%t in (`%GH% auth token`) do set TOK=%%t
git push https://x-access-token:%TOK%@github.com/VibeCoderGPT/elmateco.com.git main
if errorlevel 1 goto echec

echo.
echo  [OK] C'est envoye ! Le site est sur GitHub :
echo       https://github.com/VibeCoderGPT/elmateco.com
echo.
goto fin

:echec
echo.
echo  [ECHEC] L'envoi n'a pas fonctionne. Copie le message
echo  d'erreur ci-dessus et montre-le moi.
echo.
:fin
pause
