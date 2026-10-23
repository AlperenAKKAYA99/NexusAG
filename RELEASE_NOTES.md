# 🚀 NexusAG v1.1.1 — Sürüm Notları

**Paket:** `nexus-ag-1.1.1.vsix`  
**Sürüm:** `v1.1.1`  
**Geliştirici:** [Alperen AKKAYA](https://github.com/AlperenAKKAYA99)  
**Lisans:** MIT  

---

## 📌 Genel Bakış

**NexusAG v1.1.1**, gelişmiş **Çoklu Token Kopyalama (Bulk Token Export)** sistemi, akıllı çift yönlü token ayrıştırma motoru ve pano güvenlik kontrolleri ile hesap yönetimi iş akışlarını güçlendiriyor.

---

## ✨ v1.1.1 ile Eklenen Yenilikler

- 🔑 **Çoklu Token Kopyalama (Bulk Token Export):**
  - Kenar çubuğu panelinden veya komut paletinden (`NexusAG: Copy Account Tokens`) birden fazla hesabın `refresh_token` değerini tek tıkla panoya kopyalama.
  - **3 Format Desteği:**
    - `Plain`: Satır başına bir token (doğrudan kullanım için sade liste).
    - `Labeled`: Hesap e-postası ve isimlerini içeren açıklamalı yorum blokları (`# email`).
    - `JSON`: Harici araçlar ve betikler için yapılandırılmış `[{ "email", "refresh_token" }]` dizisi.

- 🔄 **Akıllı Çift Yönlü İçe Aktarma (Round-Trip Extract):**
  - "Token ile Ekle" penceresine yorum satırları içeren etiketli metinler veya JSON yapıştırıldığında token'lar regex ve akıllı filtreleme ile otomatik ayrıştırılır.

- 🛡️ **Pano ve Kimlik Bilgisi Güvenliği:**
  - **Sıfır Webview Sızıntısı:** Token'lar arayüze/webview'a asla aktarılmaz; doğrudan Extension Host seviyesinde işletim sistemi panosuna yazılır.
  - **Pano Otomatik Temizleme:** `ag-switchboard.tokenExport.clearClipboardSeconds` ayarı ile N saniye sonra panodaki token'ları otomatik silme imkânı.
  - **Toplu İşlem Onay Penceresi:** `ag-switchboard.tokenExport.confirmBulkCopy` ayarı ile toplu kopyalamada kazara sızıntıyı önleyici güvenlik uyarısı.

- 🌐 **10 Dilde Tam Destek:**
  - Kopyalama penceresi, seçim araçları ve bildirimler 10 dilde (TR, EN, DE, ES, FR, HI, JA, PT-BR, RU, ZH-CN) sıfır gecikmeli yerelleştirildi.

---

## 🌟 v1.1.0 ile Gelen Temel Özellikler

- 🌐 **10 Yerel Dil Desteği (Zero-Reload i18n):** Reload gerektirmeyen anında reaktif dil değişimi.
- ⚡ **Gelişmiş Çoklu Hesap & Kota Yönetimi:** Tek tıkla hesap değiştirme, anlık AI model kotaları ve `SecretStorage` kasası.
- 🛡️ **Conversation Guard & Diskten Kurtarma:** Diskteki indekslenmemiş `.pb` konuşmalarını kurtarma.
- 📊 **Kapsamlı Bento Analitik & Token Takibi:** %100 doğru token muhasebesi ve GitHub tarzı aktivite ısı haritası.

---

## 📦 Kurulum

### 1. IDE Arayüzünden Kurulum:
1. VS Code veya Antigravity IDE'yi açın.
2. Eklentiler (**Extensions**) menüsüne gelin (`Ctrl+Shift+X`).
3. Sağ üstteki `...` menüsünden **"Install from VSIX..."** seçeneğini tıklayın.
4. `nexus-ag-1.1.1.vsix` dosyasını seçin.

### 2. Terminal / Komut Satırından Kurulum:
```bash
code --install-extension nexus-ag-1.1.1.vsix
```
*(Antigravity IDE için: `antigravity-ide.cmd --install-extension nexus-ag-1.1.1.vsix --force`)*
