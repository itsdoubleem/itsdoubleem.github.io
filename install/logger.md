---
# How to install LOGGER, in the languages LOGGER speaks. See install/README.md.
#
# `en` is the source: every other language says what it says, no more. Change it first,
# then every translation, and set each changed one back to checked: false.
#
# Words the reader has to match on a screen stay as they appear there:
#   - the site's buttons are in English on every language's page: "Download for Android",
#     "Open in browser";
#   - LOGGER's own menus are named as the app shows them in that language, with the
#     Korean left off: on screen the reader's word is the large one and the Korean sits
#     small beneath it (seen in Vietnamese on the shipped build, 2026-09-26). The words
#     are tab_set, grp_backup and export_a_file from Logger_app/lang/*.json;
#   - Android's switch is named in English and in Korean, because a phone bought in
#     Korea is often set to Korean. The other languages DESCRIBE the switch rather than
#     quote it, because its exact wording in those languages was not checked on a phone.
app: logger
languages:
  en:
    checked: true
    title: How to install LOGGER
    sections:
      - heading: On Android
        steps:
          - On this page, tap the button that says "Download for Android". The file is called logger.apk and is {apkSize}.
          - When it has downloaded, open it — from the notification, or from the Download folder in your phone's files app.
          - Your phone will warn you. That is normal for an app that does not come from the Play Store. Tap Settings, turn on "Allow from this source" (on a phone set to Korean, 이 출처 허용), then go back.
          - Tap Install. There is no account and no sign-in. When LOGGER opens, choose your language.
          - To update it later, download the new file the same way and install it over the old one. Your records stay.
      - heading: In a browser
        steps:
          - Tap "Open in browser". Open it once while you have internet. After that it works without internet.
          - Your records are kept only in that browser, on that phone. Before you change phone or browser, save a backup file — SETUP › Backup › EXPORT A FILE.
  ko:
    checked: false
    unchecked: 이 안내는 개발자가 번역했고, 아직 한국어 원어민이 확인하지 않았습니다. 틀리거나 어색한 부분이 있으면 알려 주세요.
    title: LOGGER 설치 방법
    sections:
      - heading: Android에 설치
        steps:
          - 이 페이지에서 "Download for Android" 버튼을 누르세요. 파일 이름은 logger.apk이고 크기는 {apkSize}입니다.
          - 다운로드가 끝나면 파일을 여세요. 알림에서 열거나, 파일 앱의 Download(다운로드) 폴더에서 열 수 있습니다.
          - 휴대폰에 경고가 나타납니다. Play 스토어에서 받지 않은 앱이면 나오는 정상적인 경고입니다. 설정을 누르고 "이 출처 허용"을 켠 다음 뒤로 돌아가세요.
          - 설치를 누르세요. 계정도 로그인도 필요 없습니다. LOGGER가 열리면 언어를 고르세요.
          - 나중에 업데이트할 때는 새 파일을 같은 방법으로 받아 기존 앱 위에 설치하세요. 기록은 그대로 남습니다.
      - heading: 브라우저에서 쓰기
        steps:
          - '"Open in browser"를 누르세요. 처음 한 번은 인터넷이 될 때 여세요. 그다음부터는 인터넷 없이도 됩니다.'
          - 기록은 그 휴대폰의 그 브라우저에만 저장됩니다. 휴대폰이나 브라우저를 바꾸기 전에 설정 › 백업 › 파일로 내보내기에서 백업 파일을 저장하세요.
  vi:
    checked: false
    unchecked: Hướng dẫn này do người làm ứng dụng dịch và chưa được người nói tiếng Việt kiểm tra. Nếu có chỗ nào sai hoặc khó hiểu, hãy báo cho tôi.
    title: Cách cài LOGGER
    sections:
      - heading: Trên Android
        steps:
          - Trên trang này, bấm nút "Download for Android". Tệp có tên logger.apk, dung lượng {apkSize}.
          - Tải xong, hãy mở tệp — từ thông báo, hoặc từ thư mục Download trong ứng dụng quản lý tệp.
          - Điện thoại sẽ hiện cảnh báo. Điều này là bình thường với ứng dụng không tải từ Play Store. Bấm để mở phần cài đặt của điện thoại, bật công tắc cho phép cài từ nguồn này (tiếng Anh là Allow from this source, trên điện thoại tiếng Hàn là 이 출처 허용), rồi quay lại.
          - Bấm nút cài (Install). Không cần tài khoản, không cần đăng nhập. Khi LOGGER mở ra, hãy chọn ngôn ngữ của bạn.
          - Khi có bản mới, tải tệp mới theo cách tương tự và cài đè lên bản cũ. Dữ liệu của bạn vẫn còn.
      - heading: Trong trình duyệt
        steps:
          - Bấm "Open in browser". Lần đầu hãy mở khi có mạng. Sau đó ứng dụng chạy được cả khi không có mạng.
          - Dữ liệu chỉ được lưu trong trình duyệt đó, trên điện thoại đó. Trước khi đổi điện thoại hoặc trình duyệt, hãy lưu tệp sao lưu — CÀI ĐẶT › Sao lưu › XUẤT RA TỆP.
  zh:
    checked: false
    unchecked: 本说明由开发者翻译，还没有经过中文母语者核对。如有错误或看不懂的地方，请告诉我。
    title: 如何安装 LOGGER
    sections:
      - heading: 在安卓手机上安装
        steps:
          - 在本页点击 "Download for Android" 按钮。文件名是 logger.apk，大小 {apkSize}。
          - 下载完成后打开文件——从通知栏打开，或在文件管理的 Download 文件夹里打开。
          - 手机会弹出警告。不是从 Play 商店下载的应用都会这样，这是正常的。点击“设置”，打开允许从此来源安装的开关（英文是 Allow from this source，韩文手机上是 이 출처 허용），然后返回。
          - 点击“安装”。不需要账号，也不需要登录。LOGGER 打开后，选择你的语言。
          - 以后更新时，用同样的方法下载新文件，直接覆盖安装。你的记录会保留。
      - heading: 在浏览器中使用
        steps:
          - 点击 "Open in browser"。第一次请在有网络时打开，之后没有网络也能用。
          - 记录只保存在这部手机的这个浏览器里。换手机或换浏览器之前，请保存备份文件：设置 › 备份 › 导出文件。
  th:
    checked: false
    unchecked: คำแนะนำนี้ผู้ทำแอปเป็นคนแปล และยังไม่ได้ให้เจ้าของภาษาไทยตรวจ ถ้ามีตรงไหนผิดหรืออ่านไม่เข้าใจ โปรดบอกฉัน
    title: วิธีติดตั้ง LOGGER
    sections:
      - heading: ติดตั้งบน Android
        steps:
          - ในหน้านี้ แตะปุ่ม "Download for Android" ไฟล์ชื่อ logger.apk ขนาด {apkSize}
          - เมื่อดาวน์โหลดเสร็จ ให้เปิดไฟล์ จากการแจ้งเตือน หรือจากโฟลเดอร์ Download ในแอปจัดการไฟล์
          - โทรศัพท์จะแสดงคำเตือน ซึ่งเป็นเรื่องปกติสำหรับแอปที่ไม่ได้มาจาก Play Store แตะ การตั้งค่า แล้วเปิดสวิตช์ที่อนุญาตให้ติดตั้งจากแหล่งนี้ (ภาษาอังกฤษคือ Allow from this source ในโทรศัพท์ภาษาเกาหลีคือ 이 출처 허용) แล้วกดย้อนกลับ
          - แตะ ติดตั้ง ไม่ต้องมีบัญชี ไม่ต้องลงชื่อเข้าใช้ เมื่อ LOGGER เปิดขึ้น ให้เลือกภาษาของคุณ
          - เมื่อจะอัปเดต ให้ดาวน์โหลดไฟล์ใหม่แบบเดียวกัน แล้วติดตั้งทับของเดิม ข้อมูลของคุณยังอยู่ครบ
      - heading: ใช้ในเบราว์เซอร์
        steps:
          - แตะ "Open in browser" ครั้งแรกให้เปิดตอนที่มีอินเทอร์เน็ต หลังจากนั้นใช้ได้แม้ไม่มีอินเทอร์เน็ต
          - ข้อมูลจะเก็บไว้ในเบราว์เซอร์นั้น บนโทรศัพท์เครื่องนั้นเท่านั้น ก่อนเปลี่ยนโทรศัพท์หรือเบราว์เซอร์ ให้บันทึกไฟล์สำรองข้อมูลที่ ตั้งค่า › สำรองข้อมูล › ส่งออกเป็นไฟล์
  id:
    checked: false
    unchecked: Petunjuk ini diterjemahkan oleh pembuat aplikasi dan belum diperiksa oleh penutur asli bahasa Indonesia. Jika ada yang salah atau sulit dipahami, beri tahu saya.
    title: Cara memasang LOGGER
    sections:
      - heading: Di Android
        steps:
          - Di halaman ini, ketuk tombol "Download for Android". Nama berkasnya logger.apk, ukurannya {apkSize}.
          - Setelah selesai diunduh, buka berkasnya — dari notifikasi, atau dari folder Download di aplikasi pengelola berkas.
          - Ponsel akan menampilkan peringatan. Itu wajar untuk aplikasi yang bukan dari Play Store. Ketuk Setelan, nyalakan tombol yang mengizinkan pemasangan dari sumber ini (dalam bahasa Inggris Allow from this source, di ponsel berbahasa Korea 이 출처 허용), lalu kembali.
          - Ketuk Instal. Tidak perlu akun, tidak perlu masuk. Saat LOGGER terbuka, pilih bahasa Anda.
          - Untuk memperbarui nanti, unduh berkas baru dengan cara yang sama dan pasang di atas yang lama. Catatan Anda tetap ada.
      - heading: Di peramban
        steps:
          - Ketuk "Open in browser". Buka pertama kali saat ada internet. Setelah itu bisa dipakai tanpa internet.
          - Catatan Anda hanya tersimpan di peramban itu, di ponsel itu. Sebelum ganti ponsel atau peramban, simpan berkas cadangan — PENGATURAN › Cadangan › EKSPOR BERKAS.
  ne:
    checked: false
    unchecked: यो निर्देशन एप बनाउनेले अनुवाद गरेको हो, र नेपाली मातृभाषीले अझै जाँचेका छैनन्। कुनै कुरा गलत वा बुझ्न गाह्रो लागे मलाई भन्नुहोस्।
    title: LOGGER कसरी इन्स्टल गर्ने
    sections:
      - heading: Android मा
        steps:
          - यो पेजमा "Download for Android" बटन थिच्नुहोस्। फाइलको नाम logger.apk हो, साइज {apkSize}।
          - डाउनलोड सकिएपछि फाइल खोल्नुहोस् — सूचनाबाट, वा फाइल एपको Download फोल्डरबाट।
          - फोनले चेतावनी देखाउँछ। Play Store बाट नआएको एपमा यस्तो हुनु सामान्य हो। सेटिङ थिच्नुहोस्, यो स्रोतबाट इन्स्टल गर्न अनुमति दिने स्विच खोल्नुहोस् (अङ्ग्रेजीमा Allow from this source, कोरियाली भाषाको फोनमा 이 출처 허용), अनि पछाडि फर्कनुहोस्।
          - Install थिच्नुहोस्। खाता वा लगइन चाहिँदैन। LOGGER खुलेपछि आफ्नो भाषा छान्नुहोस्।
          - पछि अपडेट गर्दा, नयाँ फाइल यसरी नै डाउनलोड गरेर पुरानोमाथि इन्स्टल गर्नुहोस्। तपाईंका रेकर्ड रहिरहन्छन्।
      - heading: ब्राउजरमा
        steps:
          - '"Open in browser" थिच्नुहोस्। पहिलो पटक इन्टरनेट भएको बेला खोल्नुहोस्। त्यसपछि इन्टरनेट बिना पनि चल्छ।'
          - रेकर्ड त्यही फोनको त्यही ब्राउजरमा मात्र बस्छन्। फोन वा ब्राउजर फेर्नुअघि सेटिङ › ब्याकअप › फाइलमा निर्यात बाट ब्याकअप फाइल सेभ गर्नुहोस्।
  km:
    checked: false
    unchecked: ការណែនាំនេះ អ្នកបង្កើតកម្មវិធីជាអ្នកបកប្រែ ហើយមិនទាន់មានអ្នកនិយាយភាសាខ្មែរពិនិត្យនៅឡើយទេ។ បើមានកន្លែងណាខុស ឬពិបាកយល់ សូមប្រាប់ខ្ញុំ។
    title: របៀបដំឡើង LOGGER
    sections:
      - heading: លើ Android
        steps:
          - នៅលើទំព័រនេះ ចុចប៊ូតុង "Download for Android"។ ឯកសារឈ្មោះ logger.apk ទំហំ {apkSize}។
          - ពេលទាញយករួច សូមបើកឯកសារ — ពីការជូនដំណឹង ឬពីថត Download ក្នុងកម្មវិធីគ្រប់គ្រងឯកសារ។
          - ទូរស័ព្ទនឹងបង្ហាញការព្រមាន។ នេះជារឿងធម្មតាសម្រាប់កម្មវិធីដែលមិនមែនមកពី Play Store។ ចុច ការកំណត់ ហើយបើកកុងតាក់ដែលអនុញ្ញាតឱ្យដំឡើងពីប្រភពនេះ (ភាសាអង់គ្លេស Allow from this source លើទូរស័ព្ទភាសាកូរ៉េ 이 출처 허용) រួចត្រឡប់ក្រោយ។
          - ចុច ដំឡើង (Install)។ មិនត្រូវការគណនី ឬចូលគណនីទេ។ ពេល LOGGER បើក សូមជ្រើសរើសភាសារបស់អ្នក។
          - ពេលក្រោយ ដើម្បីធ្វើបច្ចុប្បន្នភាព សូមទាញយកឯកសារថ្មីតាមរបៀបដដែល ហើយដំឡើងពីលើកំណែចាស់។ កំណត់ត្រារបស់អ្នកនៅដដែល។
      - heading: ក្នុងកម្មវិធីរុករក
        steps:
          - ចុច "Open in browser"។ លើកដំបូង សូមបើកពេលមានអ៊ីនធឺណិត។ បន្ទាប់មក វាដំណើរការបានទោះគ្មានអ៊ីនធឺណិត។
          - កំណត់ត្រារក្សាទុកតែក្នុងកម្មវិធីរុករកនោះ លើទូរស័ព្ទនោះប៉ុណ្ណោះ។ មុនប្ដូរទូរស័ព្ទ ឬកម្មវិធីរុករក សូមរក្សាទុកឯកសារបម្រុងទុកពី កំណត់ › បម្រុងទុក › នាំចេញជាឯកសារ។
---
