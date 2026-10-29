// Statische Inhalte: Standard-Packliste und Thai-Sätze.

window.PACK_DEFAULTS = {
  'Dokumente': [
    'Reisepass (mind. 6 Monate gültig)',
    'Flugtickets / Bordkarten',
    'Thailand Digital Arrival Card (TDAC) ausgefüllt',
    'Hotelbuchungen',
    'Reiseversicherungs-Nachweis',
    'Kreditkarte + Bankomatkarte',
    'Führerschein + internationaler Führerschein',
    'Kopien aller Dokumente (auch digital)',
    'Etwas Bargeld in Euro'
  ],
  'Kleidung': [
    'Leichte T-Shirts',
    'Kurze Hosen',
    'Lange, leichte Hose (für Tempel)',
    'Schultern bedeckendes Oberteil (für Tempel)',
    'Unterwäsche & Socken',
    'Badesachen',
    'Flip-Flops / Sandalen',
    'Bequeme Schuhe',
    'Regenjacke / Poncho',
    'Dünner Pullover (Klimaanlage, Bus, Flug)',
    'Sonnenhut / Kappe'
  ],
  'Elektronik': [
    'Handy + Ladekabel',
    'Powerbank (im Handgepäck!)',
    'Reiseadapter',
    'Kopfhörer',
    'eSIM / thailändische SIM',
    'Kamera + Speicherkarte',
    'Wasserdichte Handyhülle'
  ],
  'Hygiene': [
    'Zahnbürste & Zahnpasta',
    'Sonnencreme (LSF 50)',
    'After-Sun',
    'Mückenspray (DEET/Icaridin)',
    'Deo',
    'Shampoo / Duschgel (Reisegröße)',
    'Taschentücher & Feuchttücher',
    'Desinfektionsgel',
    'Sonnenbrille'
  ],
  'Medikamente': [
    'Persönliche Medikamente (+ Rezept)',
    'Mittel gegen Durchfall',
    'Elektrolyte',
    'Schmerz- / Fiebermittel',
    'Antihistaminikum (Allergie, Stiche)',
    'Pflaster & Blasenpflaster',
    'Wunddesinfektion',
    'Mittel gegen Reiseübelkeit'
  ]
};

// Platzhalter in Thai/Lautschrift:
//   {I}  -> Personalpronomen "ich" (ผม phǒm / ฉัน chǎn)
// pol: 's' = Aussage (khráp / khâ), 'q' = Frage (khráp / khá), fehlt = ohne Höflichkeitspartikel
window.PHRASES = [
  { cat: 'Begrüßung', items: [
    { id: 'g1', de: 'Hallo / Guten Tag / Tschüss', th: 'สวัสดี', tr: 'sà-wàt-dii', pol: 's' },
    { id: 'g2', de: 'Danke', th: 'ขอบคุณ', tr: 'khàwp-khun', pol: 's' },
    { id: 'g3', de: 'Danke vielmals', th: 'ขอบคุณมาก', tr: 'khàwp-khun mâak', pol: 's' },
    { id: 'g4', de: 'Wie geht es dir?', th: 'สบายดีไหม', tr: 'sà-baai-dii mǎi', pol: 'q' },
    { id: 'g5', de: 'Mir geht es gut', th: 'สบายดี', tr: 'sà-baai-dii', pol: 's' },
    { id: 'g6', de: 'Ich heiße …', th: '{I}ชื่อ …', tr: '{I} chʉ̂ʉ …', pol: 's' },
    { id: 'g7', de: 'Entschuldigung / Verzeihung', th: 'ขอโทษ', tr: 'khǎw-thôot', pol: 's' },
    { id: 'g8', de: 'Kein Problem / Macht nichts', th: 'ไม่เป็นไร', tr: 'mâi pen rai', pol: 's' },
    { id: 'g9', de: 'Ja / Richtig', th: 'ใช่', tr: 'châi', pol: 's' },
    { id: 'g10', de: 'Nein / Nicht richtig', th: 'ไม่ใช่', tr: 'mâi châi', pol: 's' },
    { id: 'g11', de: 'Ich verstehe nicht', th: '{I}ไม่เข้าใจ', tr: '{I} mâi khâo-jai', pol: 's' },
    { id: 'g12', de: 'Sprechen Sie Englisch?', th: 'พูดภาษาอังกฤษได้ไหม', tr: 'phûut phaa-sǎa ang-grìt dâai mǎi', pol: 'q' },
    { id: 'g13', de: 'Ich komme aus Österreich', th: '{I}มาจากออสเตรีย', tr: '{I} maa jàak áwt-sà-dtria', pol: 's' }
  ]},
  { cat: 'Essen bestellen', items: [
    { id: 'e1', de: 'Die Speisekarte, bitte', th: 'ขอเมนูหน่อย', tr: 'khǎw mee-nuu nòi', pol: 's' },
    { id: 'e2', de: 'Ich möchte das hier', th: 'เอาอันนี้', tr: 'ao an-níi', pol: 's' },
    { id: 'e3', de: 'Nicht scharf, bitte', th: 'ไม่เผ็ด', tr: 'mâi phèt', pol: 's' },
    { id: 'e4', de: 'Nur ein bisschen scharf', th: 'เผ็ดนิดหน่อย', tr: 'phèt nít-nòi', pol: 's' },
    { id: 'e5', de: 'Ich esse vegetarisch', th: '{I}กินมังสวิรัติ', tr: '{I} gin mang-sà-wí-rát', pol: 's' },
    { id: 'e6', de: 'Ohne Fleisch, bitte', th: 'ไม่ใส่เนื้อสัตว์', tr: 'mâi sài nʉ́a-sàt', pol: 's' },
    { id: 'e7', de: 'Ich bin allergisch gegen Erdnüsse', th: '{I}แพ้ถั่วลิสง', tr: '{I} phɛ́ɛ thùa-lí-sǒng', pol: 's' },
    { id: 'e8', de: 'Ohne Zucker, bitte', th: 'ไม่ใส่น้ำตาล', tr: 'mâi sài nám-taan', pol: 's' },
    { id: 'e9', de: 'Ein Wasser, bitte', th: 'ขอน้ำเปล่า', tr: 'khǎw náam-plàao', pol: 's' },
    { id: 'e10', de: 'Ohne Eis, bitte', th: 'ไม่ใส่น้ำแข็ง', tr: 'mâi sài náam-khɛ̌ng', pol: 's' },
    { id: 'e11', de: 'Sehr lecker!', th: 'อร่อยมาก', tr: 'à-ròi mâak', pol: 's' },
    { id: 'e12', de: 'Zum Mitnehmen', th: 'กลับบ้าน', tr: 'glàp bâan', pol: 's' },
    { id: 'e13', de: 'Die Rechnung, bitte', th: 'เช็คบิล', tr: 'chék bin', pol: 's' }
  ]},
  { cat: 'Preise verhandeln', items: [
    { id: 'p1', de: 'Wie viel kostet das?', th: 'อันนี้เท่าไหร่', tr: 'an-níi thâo-rài', pol: 'q' },
    { id: 'p2', de: 'Das ist zu teuer', th: 'แพงไป', tr: 'phɛɛng pai', pol: 's' },
    { id: 'p3', de: 'Geht es günstiger?', th: 'ลดได้ไหม', tr: 'lót dâai mǎi', pol: 'q' },
    { id: 'p4', de: 'Geht 200 Baht?', th: 'สองร้อยบาทได้ไหม', tr: 'sǎwng rɔ́ɔi bàat dâai mǎi', pol: 'q' },
    { id: 'p5', de: 'Ich schaue nur', th: 'ดูก่อน', tr: 'duu gàwn', pol: 's' },
    { id: 'p6', de: 'Einverstanden / Okay', th: 'ตกลง', tr: 'tòk-long', pol: 's' },
    { id: 'p7', de: 'Kann ich mit Karte zahlen?', th: 'จ่ายด้วยบัตรได้ไหม', tr: 'jàai dûai bàt dâai mǎi', pol: 'q' },
    { id: 'p8', de: 'Ich will das nicht', th: 'ไม่เอา', tr: 'mâi ao', pol: 's' }
  ]},
  { cat: 'Wegbeschreibung', items: [
    { id: 'w1', de: 'Wo ist …?', th: '… อยู่ที่ไหน', tr: '… yùu thîi-nǎi', pol: 'q' },
    { id: 'w2', de: 'Wo ist die Toilette?', th: 'ห้องน้ำอยู่ที่ไหน', tr: 'hâwng-náam yùu thîi-nǎi', pol: 'q' },
    { id: 'w3', de: 'Bitte hierhin (Adresse zeigen)', th: 'ไปที่นี่', tr: 'pai thîi-nîi', pol: 's' },
    { id: 'w4', de: 'Wie viel kostet es nach …?', th: 'ไป … เท่าไหร่', tr: 'pai … thâo-rài', pol: 'q' },
    { id: 'w5', de: 'Bitte das Taxameter einschalten', th: 'เปิดมิเตอร์ด้วย', tr: 'pə̀ət mí-tə̂ə dûai', pol: 's' },
    { id: 'w6', de: 'Links', th: 'ซ้าย', tr: 'sáai', pol: 's' },
    { id: 'w7', de: 'Rechts', th: 'ขวา', tr: 'khwǎa', pol: 's' },
    { id: 'w8', de: 'Geradeaus', th: 'ตรงไป', tr: 'trong pai', pol: 's' },
    { id: 'w9', de: 'Bitte hier anhalten', th: 'จอดตรงนี้', tr: 'jàwt trong-níi', pol: 's' },
    { id: 'w10', de: 'Ist es weit?', th: 'ไกลไหม', tr: 'glai mǎi', pol: 'q' },
    { id: 'w11', de: 'Langsamer, bitte', th: 'ช้าๆ หน่อย', tr: 'cháa-cháa nòi', pol: 's' }
  ]},
  { cat: 'Notfall', items: [
    { id: 'n1', de: 'Hilfe!', th: 'ช่วยด้วย', tr: 'chûai dûai' },
    { id: 'n2', de: 'Rufen Sie einen Arzt!', th: 'เรียกหมอให้หน่อย', tr: 'rîak mǎw hâi nòi', pol: 's' },
    { id: 'n3', de: 'Rufen Sie einen Krankenwagen!', th: 'เรียกรถพยาบาลให้หน่อย', tr: 'rîak rót phá-yaa-baan hâi nòi', pol: 's' },
    { id: 'n4', de: 'Rufen Sie die Polizei!', th: 'เรียกตำรวจให้หน่อย', tr: 'rîak tam-rùat hâi nòi', pol: 's' },
    { id: 'n5', de: 'Wo ist das Krankenhaus?', th: 'โรงพยาบาลอยู่ที่ไหน', tr: 'roong-phá-yaa-baan yùu thîi-nǎi', pol: 'q' },
    { id: 'n6', de: 'Wo ist eine Apotheke?', th: 'ร้านขายยาอยู่ที่ไหน', tr: 'ráan khǎai yaa yùu thîi-nǎi', pol: 'q' },
    { id: 'n7', de: 'Mir geht es nicht gut / Ich bin krank', th: '{I}ไม่สบาย', tr: '{I} mâi sà-baai', pol: 's' },
    { id: 'n8', de: 'Es tut hier weh', th: 'เจ็บตรงนี้', tr: 'jèp trong-níi', pol: 's' },
    { id: 'n9', de: 'Ich habe mich verlaufen', th: '{I}หลงทาง', tr: '{I} lǒng-thaang', pol: 's' },
    { id: 'n10', de: 'Mein Pass wurde gestohlen', th: 'หนังสือเดินทางของ{I}ถูกขโมย', tr: 'nǎng-sʉ̌ʉ dəən-thaang khǎwng {I} thùuk khà-mooi', pol: 's' },
    { id: 'n11', de: 'Ich brauche Hilfe', th: '{I}ต้องการความช่วยเหลือ', tr: '{I} dtâwng-gaan khwaam chûai-lʉ̌a', pol: 's' }
  ]}
];

window.GENDER_FORMS = {
  m: { I_th: 'ผม', I_tr: 'phǒm', s_th: 'ครับ', s_tr: 'khráp', q_th: 'ครับ', q_tr: 'khráp' },
  f: { I_th: 'ฉัน', I_tr: 'chǎn', s_th: 'ค่ะ', s_tr: 'khâ', q_th: 'คะ', q_tr: 'khá' }
};
