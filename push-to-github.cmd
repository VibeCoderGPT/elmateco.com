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
git remote remove origin >nul 2>&1
git remote add origin https://github.com/VibeCoderGPT/elmateco.com.git
git push -u origin main
if errorlevel 1 goto echec

echo.
echo  [OK] C'est envoye ! Le site est sur GitHub :
echo       https://github.com/VibeCoderGPT/elmateco.com
echo.
goto fin

:echec
echo.
echo  [ECHEC] L'envoi n'a pas fonctionne.
echo  Si une fenetre de connexion GitHub s'est ouverte, connecte-toi,
echo  puis relance ce script (double-clic). Sinon, copie le message
echo  d'erreur ci-dessus et montre-le moi.
echo.
:fin
pause
