@echo off
REM Kuxnya Generator GUI ni ishga tushirish (Windows)
REM Foydalanish: ushbu fayl ustiga 2 marta bosing

cd /d "%~dp0"

REM 1) Python launcher (eng ishonchli)
where py >nul 2>&1
if %errorlevel%==0 (
    py -3 gui.py
    goto :end
)

REM 2) Default python
where python >nul 2>&1
if %errorlevel%==0 (
    python gui.py
    goto :end
)

REM 3) To'g'ridan-to'g'ri yo'l (zaxira)
"C:\Users\ALTECHUZ\AppData\Local\Programs\Python\Python311\python.exe" gui.py

:end
pause
