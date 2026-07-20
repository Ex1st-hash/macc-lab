@echo off
setlocal EnableExtensions

cd /d "%~dp0"
set "HOST=127.0.0.1"
set "START_PORT=4173"
set "END_PORT=4193"

where py >nul 2>nul
if %errorlevel%==0 (
  set "PY_CMD=py"
  goto pick_port
)

where python >nul 2>nul
if %errorlevel%==0 (
  set "PY_CMD=python"
  goto pick_port
)

echo Python was not found on this computer.
echo Install Python first, then run this script again.
pause
exit /b 1

:pick_port
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$ports=%START_PORT%..%END_PORT%; $selected=$null; foreach($port in $ports){ try { $listener=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse('%HOST%'), $port); $listener.Start(); $listener.Stop(); $selected=$port; break } catch {} }; if($selected -ne $null){ Write-Output $selected }"`) do (
  set "PORT=%%P"
)

if not defined PORT (
  echo No free port was found between %START_PORT% and %END_PORT%.
  echo Close any local preview server and try again.
  pause
  exit /b 1
)

set "URL=http://%HOST%:%PORT%/"
echo Starting local server at %URL%
start "MACC Local Server" /D "%~dp0" cmd /k "%PY_CMD% -m http.server %PORT%"

powershell -NoProfile -Command "$deadline=(Get-Date).AddSeconds(8); while((Get-Date) -lt $deadline){ try { $client=[System.Net.Sockets.TcpClient]::new('%HOST%', %PORT%); $client.Close(); exit 0 } catch { Start-Sleep -Milliseconds 200 } }; exit 1"
if errorlevel 1 (
  echo.
  echo The local server did not become ready in time.
  echo If another program is already using this port, close it and try again.
  echo You can also wait for the server window to show it is running, then open:
  echo   %URL%
  pause
  exit /b 1
)

start "" "%URL%"
echo.
echo Server is running at %URL%
echo Close the "MACC Local Server" window to stop it.
goto :eof
