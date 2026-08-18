/* ============================================================
   Default checklist template — EDIT THIS FILE to change defaults.

   HOW THE VERSIONING/MERGE SYSTEM WORKS (see js/app.js "Template
   versioning / merge" section for the code):

   - Every user's browser keeps its OWN copy of this template in
     localStorage (so their custom edits/reorders survive updates).
   - `version` below is compared against each user's stored copy.
     When you ship a HIGHER version than what they have saved, the
     app merges your changes into their copy automatically:
       - New section/item ids that don't exist locally are ADDED
         in the position they have here.
       - Ids that used to exist here but are gone now are HIDDEN
         (soft-deleted, not erased) in the user's copy — they stop
         counting toward totals but nothing is destroyed.
       - Ids that still exist in both are left ALONE — if the user
         edited that item's text, their edit wins, this file does
         NOT overwrite it.
     If the user is mid-checklist (something already checked) the
     merge is deferred until they start their next flight, so the
     list never changes under them mid-run.

   RULES FOR EDITING:

   1. Changing `text` on an EXISTING id updates the label shown to
      brand-new users only — existing users keep whatever text is
      already in their local copy (by design, see above). If you
      really need to force new wording onto everyone, give the item
      a new id instead (treat the old one as removed).
   2. Reordering existing items (moving lines around without
      changing ids) only affects brand-new installs and anyone who
      resets their template ("Şablonu sıfırla" in the edit screen).
      Existing users keep their current order — the merge never
      reshuffles items that already exist on both sides.
   3. Adding a brand-new item: add a new object with a NEW, UNIQUE
      id (never reuse an old id). Put it wherever you want it to
      appear — that position is exactly where it gets inserted for
      everyone on next merge.
   4. Removing an item: just delete its object from this file. It
      will be hidden (not erased) for everyone who already has it.
   5. IMPORTANT — every time you add, remove, or rename an id here,
      bump `version` by 1 below. If you only reword existing text
      without touching ids, bumping version is optional (it won't
      change anything for existing users anyway, see rule 1).
   6. Ids just need to be unique within the whole template — the
      "s<section><i item>" pattern is only a convention, not
      required. Never start a new id with "u-" — that prefix is
      reserved for items end-users create themselves in the edit
      screen, so the merge logic always leaves it alone.
   7. `critical` = true shows the red "KRİTİK" tag and red checkbox.
   8. `phase` groups sections under a collapsible header. Valid
      values: "hazirlik", "saha", "ucus-sonrasi".
   9. `blocking` is currently unused by the app logic — kept for
      forward compatibility, safe to leave as false.
   ============================================================ */

window.DEFAULT_TEMPLATE = {
  name: "Uçuş Öncesi Checklist",
  version: 3,

  sections: [

    // ---- HAZIRLIK ----
    {
      id: "s1", title: "HAZIRLIK", phase: "hazirlik", blocking: false,
      items: [
        { id: "s1i1", text: "Pusula kalibrasyonları yapıldı", critical: false },
        { id: "s1i2", text: "Uçak bataryaları ve kumanda (verici) bataryası tam şarj", critical: false },
        { id: "s1i3", text: "Yer istasyonu (GCS) bilgisayarının şarjı tam", critical: false },
        { id: "s1i4", text: "Görev planı (mission) Mission Planner'a yüklendi ve waypoint'ler gözden geçirildi", critical: false },
        { id: "s1i5", text: "Yedek pervane", critical: false },
        { id: "s1i6", text: "Yedek uçuş bataryası (şarjlı) ve yedek kumanda pili", critical: false },
        { id: "s1i7", text: "Yedek vida/somun, control horn", critical: false }
      ]
    },

    // ---- TAKIM ÇANTASI ----
    {
      id: "s1a", title: "TAKIM ÇANTASI", phase: "hazirlik", blocking: false,
      items: [
        { id: "s1ai1", text: "Yedek pervane", critical: false },
        { id: "s1ai2", text: "Yedek GPS", critical: false },
        { id: "s1ai3", text: "Uçak Pili / İnverter Pili", critical: false },
        { id: "s1ai4", text: "Yedek Pil", critical: false },
        { id: "s1ai5", text: "Servo Yekeler", critical: false },
        { id: "s1ai6", text: "Pervane Somunları", critical: false },
        { id: "s1ai7", text: "Yedek Somun", critical: false },
        { id: "s1ai8", text: "Pervane Sıkma Teli", critical: false },
        { id: "s1ai9", text: "Tornavida Seti", critical: false },
        { id: "s1ai10", text: "Yıldız Tornavida", critical: false },
        { id: "s1ai11", text: "Pense", critical: false },
        { id: "s1ai12", text: "Karga Burun", critical: false },
        { id: "s1ai13", text: "Yan Keski", critical: false },
        { id: "s1ai14", text: "Maket Bıçağı", critical: false },
        { id: "s1ai15", text: "Matkap", critical: false },
        { id: "s1ai16", text: "Multimetre", critical: false },
        { id: "s1ai17", text: "Su Terazisi", critical: false },
        { id: "s1ai18", text: "Hızlı Yapıştırıcı", critical: false },
        { id: "s1ai19", text: "Bantlar (Kağıt, Lifli, Çift Taraflı)", critical: false },
        { id: "s1ai20", text: "Kelepçe", critical: false },
        { id: "s1ai21", text: "Cırt Cırt", critical: false },
        { id: "s1ai22", text: "Lastik", critical: false },
        { id: "s1ai23", text: "Silikon Çubuklar", critical: false },
        { id: "s1ai24", text: "Vida Kutusu", critical: false },
        { id: "s1ai25", text: "USB Kablo (Anten Tracker için)", critical: false },
        { id: "s1ai26", text: "Çakmak", critical: false },
        { id: "s1ai27", text: "İnverter", critical: false },
        { id: "s1ai28", text: "2x Tabure", critical: false }
      ]
    },

    // ---- SAHADA — MONTAJ SONRASI ----
    {
      id: "s2", title: "SAHADA — MONTAJ SONRASI", phase: "saha", blocking: false,
      items: [
        { id: "s2i1", text: "Kanat/kuyruk bağlantı pimleri ve kilitler tam oturmuş, boşluk yok", critical: false },
        { id: "s2i2", text: "Menteşeler (aileron/elevatör/rudder) elle kontrol — yırtık/gevşek yok", critical: false },
        { id: "s2i3", text: "Pervane/motor tutturması sıkı, pervane hasarsız", critical: false },
        { id: "s2i4", text: "Motor dönüş yönü doğru (kısa gaz testiyle doğrulandı)", critical: false },
        { id: "s2i5", text: "Ağırlık merkezi (CG) elle dengeleme testiyle doğru noktada", critical: false },
        { id: "s2i6", text: "GPS/RC/video anten bağlantıları sağlam, GPS anteni açık gökyüzüne bakıyor", critical: false },
        { id: "s2i7", text: "Kalkış alanı ve rota üzerinde engel/insan yok", critical: false },
        { id: "s2i8", text: "Rüzgar yönü belirlendi, kalkış rüzgara karşı planlandı", critical: false }
      ]
    },

    // ---- YER İSTASYONU / YAZILIM ----
    {
      id: "s3", title: "YER İSTASYONU / YAZILIM", phase: "saha", blocking: false,
      items: [
        { id: "s3i1", text: "Raspberry Pi - Pixhawk UART bağlantısı kontrol edildi", critical: false },
        { id: "s3i2", text: "Görev bilgisayarı (RPi) açıldı, wifi bağlantısı ssh ile test edildi, görüntü işleme yazılımı başlatıldı ve çalıştığı doğrulandı", critical: false },
        { id: "s3i3", text: "Mission Planner'da uçağın GPS konumu (harita üzerinde ikon) geldi", critical: false },
        { id: "s3i4", text: "Mission Planner'da video aktarımı/HUD görüntüsü düzgün geliyor", critical: false },
        { id: "s3i5", text: "Anten tracker home pozisyonu doğru girildi", critical: false },
        { id: "s3i6", text: "Anten tracker uçağı takip ediyor (kısa test hareketiyle doğrulandı)", critical: false },
        { id: "s3i7", text: "OBS'de uçuş öncesi ekran kaydı başlatıldı", critical: false }
      ]
    },

    // ---- ARM ÖNCESİ ----
    {
      id: "s4", title: "ARM ÖNCESİ", phase: "saha", blocking: true,
      items: [
        { id: "s4i1", text: "Stabilize modda elle eğ: sağ kanat aşağı → sağ aileron YUKARI (gözle doğrula)", critical: true },
        { id: "s4i2", text: "Burun aşağı hareket ettir → elevatör YUKARI (gözle doğrula)", critical: true },
        { id: "s4i3", text: "Rudder: sağ komut → kuyruk sağa (gözle doğrula)", critical: true },
        { id: "s4i3b", text: "Pusula kalibrasyonu yapıldı", critical: true },
        { id: "s4i4b", text: "GPS, servo gibi ayar gerektiren parça değiştiyse konfigürasyon tekrar yapıldı.", critical: true },
        { id: "s4i5", text: "Dataflash log kaydı başladı (hata mesajı yok)", critical: false },
        { id: "s4i6", text: "Manuel kumanda kontrolleri yapıldı", critical: false },
        { id: "s4i7", text: "Uçuş modu anahtarı tüm pozisyonlarda doğru modu gösteriyor (TX/MP'den kontrol)", critical: false },
        { id: "s4i8", text: "Gaz kolu boşta motor idle/duruyor, arm-disarm doğru çalışıyor", critical: false },
        { id: "s4i9", text: "GPS fix alındı, HDOP (1-2 arası) kabul edilebilir seviyede (MP'den bak)", critical: false },
        { id: "s4i10", text: "Batarya voltajı GCS üzerinden kontrol edildi", critical: false },
        { id: "s4i11", text: "Failsafe (RC/GCS/batarya) ayarları aktif ve biliniyor", critical: false }
      ]
    },

    // ---- UÇUŞ SONRASI ----
    {
      id: "s5", title: "UÇUŞ SONRASI", phase: "ucus-sonrasi", blocking: false,
      items: [
        { id: "s5i1", text: "Batarya sıcaklığı ve hasar kontrolü yapıldı", critical: false },
        { id: "s5i2", text: "OBS kaydı durduruldu, dosya kontrol edildi", critical: false },
        { id: "s5i3", text: "Log indirildi ve yedeklendi", critical: false },
        { id: "s5i4", text: "Görev bilgisayarı (RPi) terminalden düzgün kapatıldı (fişten çekmeden önce)", critical: false },
        { id: "s5i5", text: "Gövde/kanat/kuyrukta görünür hasar taraması yapıldı", critical: false },
        { id: "s5i6", text: "Uçuş notu: süre, mod, gözlemlenen sorun (varsa) yazıldı", critical: false }
      ]
    }

  ]
};
