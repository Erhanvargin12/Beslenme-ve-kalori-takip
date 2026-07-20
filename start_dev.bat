@echo off
setlocal enabledelayedexpansion

echo ===========================================
echo Akilli Beslenme - Gelistirme Ortami Baslatici
echo ===========================================
echo.

:: 1. Wi-Fi IPv4 adresini bul
set "IP_ADDR="
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"IPv4 Adresi"') do (
    set "ip=%%A"
    set "ip=!ip: =!"
    :: Eger IP 172. ile baslamiyorsa (Sanal ag degilse) bunu kullan
    echo !ip! | findstr /b "172." >nul
    if errorlevel 1 (
        set "IP_ADDR=!ip!"
    )
)

if "!IP_ADDR!"=="" (
    echo [HATA] Gecerli bir Wi-Fi IP adresi bulunamadi. Varsayilan 127.0.0.1 kullanilacak.
    set "IP_ADDR=127.0.0.1"
) else (
    echo [BILGI] Bulunan Wi-Fi IP Adresi: !IP_ADDR!
)

:: 2. api_config.dart dosyasini guncelle
set "CONFIG_FILE=akilli_beslenme_mobil\lib\config\api_config.dart"
if exist "%CONFIG_FILE%" (
    echo [BILGI] Mobil uygulama IP adresi guncelleniyor...
    
    :: Gecici bir VBS scripti kullanarak Regex degisimi yap
    echo Set fso = CreateObject^("Scripting.FileSystemObject"^) > update_ip.vbs
    echo Set f = fso.OpenTextFile^("%CONFIG_FILE%", 1^) >> update_ip.vbs
    echo content = f.ReadAll >> update_ip.vbs
    echo f.Close >> update_ip.vbs
    
    echo Set regEx = New RegExp >> update_ip.vbs
    echo regEx.Global = True >> update_ip.vbs
    echo regEx.Pattern = "defaultValue:\s*'[\d\.]+'" >> update_ip.vbs
    echo content = regEx.Replace^(content, "defaultValue: '!IP_ADDR!'"^) >> update_ip.vbs
    
    echo regEx.Pattern = "ör\. [\d\.]+:\d+" >> update_ip.vbs
    echo content = regEx.Replace^(content, "ör. !IP_ADDR!:3000"^) >> update_ip.vbs
    
    echo Set f = fso.OpenTextFile^("%CONFIG_FILE%", 2^) >> update_ip.vbs
    echo f.Write content >> update_ip.vbs
    echo f.Close >> update_ip.vbs
    
    cscript //nologo update_ip.vbs
    del update_ip.vbs
    echo [BASARILI] Mobil uygulama IP adresi '!IP_ADDR!' olarak guncellendi.
) else (
    echo [UYARI] api_config.dart dosyasi bulunamadi!
)

echo.
echo [BILGI] Backend sunucusu baslatiliyor...
echo ===========================================
npm run dev
