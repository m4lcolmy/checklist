/* ============================================================
   Default checklist template — the mandatory baseline used by new
   installations and by "Şablonu sıfırla".

   EXISTING USERS ARE UPDATED THROUGH TEMPLATE_UPDATES BELOW:

   - Every update needs a permanent unique `id` and increasing
     `sequence`. Never edit or reuse a shipped update.
   - `type: "mandatory"` is applied automatically for every user.
   - `type: "optional"` is offered with Apply / Skip actions. Keep
     optional content out of this mandatory baseline; add it only
     through that update's operations.
   - Operations are explicit and idempotent, so mandatory text,
     placement and order changes are enforceable without pulling in
     a declined optional update.
   - A started flight is never changed. Accepted/mandatory updates
     wait for the next flight when any flight data already exists.

   AUTHORING RULES:

   1. Update this baseline for mandatory changes, bump `version`,
      and append a matching mandatory migration below.
   2. For optional changes, append only an optional migration below.
   3. Supported operations are `upsertItem`, `removeItem`,
      `setItemOrder`, `upsertSection`, `removeSection`, and
      `setSectionOrder` (see js/app.js "Template updates").
   4. Item and section ids must be globally unique. Never start a
      default id with "u-"; that prefix belongs to user content.
   5. `critical` only controls the red "KRİTİK" styling. Every
      visible checklist item counts toward completion.
   6. `phase` is "hazirlik", "saha", or "ucus-sonrasi".
   7. Bump the service-worker cache in sw.js for every release.
   ============================================================ */

window.DEFAULT_TEMPLATE = {
  name: "Uçuş Öncesi Checklist",
  version: 5,

  sections: [

    // ---- HAZIRLIK ----
    {
      id: "s1", title: "HAZIRLIK", phase: "hazirlik", blocking: false,
      items: [
        { id: "s1i1", text: "Pusula kalibrasyonları yapıldı", critical: false },
        { id: "s1i2a", text: "Uçak bataryaları tam şarj", critical: false },
        { id: "s1i2b", text: "Kumanda (verici) bataryası tam şarj", critical: false },
        { id: "s1i2c", text: "Anten Tracker bataryası şarjı yeterli seviyede", critical: false },
        { id: "s1i3", text: "Yer istasyonu (GCS) bilgisayarının şarjı tam", critical: false },
        { id: "s1i4", text: "Görev planı (mission) Mission Planner'a yüklendi ve waypoint'ler gözden geçirildi", critical: false }
      ]
    },

    // ---- TAKIM ÇANTASI ----
    {
      id: "s1a", title: "TAKIM ÇANTASI", phase: "hazirlik", blocking: false,
      items: [
        { id: "s1ai1", text: "Yedek pervane", critical: false },
        { id: "s1ai2", text: "Yedek GPS", critical: false },
        { id: "s1ai29", text: "Kumanda", critical: false },
        { id: "s1ai30", text: "Anten Tracker", critical: false },
        { id: "s1ai3", text: "Uçak Pili / İnverter Pili", critical: false },
        { id: "s1ai4", text: "Yedek Pil", critical: false },
        { id: "s1ai31", text: "Yedek uçuş bataryası (şarjlı) ve yedek kumanda pili", critical: false },
        { id: "s1ai5", text: "Servo Yekeler", critical: false },
        { id: "s1ai32", text: "Yedek vida/somun, control horn", critical: false },
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
        { id: "s1ai22", text: "Lastik", critical: false },
        { id: "s1ai23", text: "Silikon Çubuklar", critical: false },
        { id: "s1ai24", text: "Vida Kutusu", critical: false },
        { id: "s1ai25", text: "USB Kablo (Anten Tracker için)", critical: false },
        { id: "s1ai26", text: "Çakmak", critical: false },
        { id: "s1ai27", text: "İnverter", critical: false },
        { id: "s1ai33", text: "Kırmızı Hedef", critical: false },
        { id: "s1ai34", text: "Mavi Hedef", critical: false },
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

/* ============================================================
   Append-only update catalog for existing installations.

   Optional update example (do not uncomment; use fresh ids):
   {
     id: "optional-example", sequence: 3, version: 6,
     type: "optional", title: "İsteğe bağlı liste güncellemesi",
     summary: "Örnek madde eklenir.",
     operations: [
       { op:"upsertItem", sectionId:"s1", afterId:"s1i1",
         item:{ id:"example-id", text:"Örnek", critical:false } }
     ]
   }
   ============================================================ */
window.TEMPLATE_UPDATES = [
  {
    id: "2026-08-battery-and-toolbox",
    sequence: 1,
    version: 4,
    type: "mandatory",
    title: "Zorunlu batarya ve takım çantası güncellemesi",
    summary: "Batarya kontrolleri ayrıldı; Anten Tracker kontrolü ve takım çantası malzemeleri güncellendi.",
    operations: [
      { op:"upsertSection", position:"start", section:{ id:"s1", title:"HAZIRLIK", phase:"hazirlik", blocking:false } },
      { op:"upsertSection", afterId:"s1", section:{ id:"s1a", title:"TAKIM ÇANTASI", phase:"hazirlik", blocking:false } },
      { op:"removeItem", id:"s1i2" },
      { op:"removeItem", id:"s1i5" },
      { op:"removeItem", id:"s1i6" },
      { op:"removeItem", id:"s1i7" },
      { op:"upsertItem", sectionId:"s1", afterId:"s1i1", item:{ id:"s1i2a", text:"Uçak bataryaları tam şarj", critical:false } },
      { op:"upsertItem", sectionId:"s1", afterId:"s1i2a", item:{ id:"s1i2b", text:"Kumanda (verici) bataryası tam şarj", critical:false } },
      { op:"upsertItem", sectionId:"s1", afterId:"s1i2b", item:{ id:"s1i2c", text:"Anten Tracker bataryası şarjı yeterli seviyede", critical:false } },
      { op:"upsertItem", sectionId:"s1a", afterId:"s1ai2", item:{ id:"s1ai29", text:"Kumanda", critical:false } },
      { op:"upsertItem", sectionId:"s1a", afterId:"s1ai29", item:{ id:"s1ai30", text:"Anten Tracker", critical:false } },
      { op:"upsertItem", sectionId:"s1a", afterId:"s1ai4", item:{ id:"s1ai31", text:"Yedek uçuş bataryası (şarjlı) ve yedek kumanda pili", critical:false } },
      { op:"upsertItem", sectionId:"s1a", afterId:"s1ai5", item:{ id:"s1ai32", text:"Yedek vida/somun, control horn", critical:false } },
      { op:"upsertItem", sectionId:"s1a", afterId:"s1ai27", item:{ id:"s1ai33", text:"Kırmızı Hedef", critical:false } },
      { op:"upsertItem", sectionId:"s1a", afterId:"s1ai33", item:{ id:"s1ai34", text:"Mavi Hedef", critical:false } },
      { op:"setItemOrder", sectionId:"s1", ids:["s1i1","s1i2a","s1i2b","s1i2c","s1i3","s1i4"] },
      { op:"setItemOrder", sectionId:"s1a", ids:["s1ai1","s1ai2","s1ai29","s1ai30","s1ai3","s1ai4","s1ai31","s1ai5","s1ai32","s1ai6","s1ai7","s1ai8","s1ai9","s1ai10","s1ai11","s1ai12","s1ai13","s1ai14","s1ai15","s1ai16","s1ai17","s1ai18","s1ai19","s1ai20","s1ai21","s1ai22","s1ai23","s1ai24","s1ai25","s1ai26","s1ai27","s1ai33","s1ai34","s1ai28"] }
    ]
  },
  {
    id: "2026-08-remove-cirt-cirt",
    sequence: 2,
    version: 5,
    type: "mandatory",
    title: "Zorunlu takım çantası güncellemesi",
    summary: "Cırt Cırt, Takım Çantası listesinden kaldırıldı.",
    operations: [
      { op:"removeItem", id:"s1ai21", hard:true },
      { op:"setItemOrder", sectionId:"s1a", ids:["s1ai1","s1ai2","s1ai29","s1ai30","s1ai3","s1ai4","s1ai31","s1ai5","s1ai32","s1ai6","s1ai7","s1ai8","s1ai9","s1ai10","s1ai11","s1ai12","s1ai13","s1ai14","s1ai15","s1ai16","s1ai17","s1ai18","s1ai19","s1ai20","s1ai22","s1ai23","s1ai24","s1ai25","s1ai26","s1ai27","s1ai33","s1ai34","s1ai28"] }
    ]
  }
];
