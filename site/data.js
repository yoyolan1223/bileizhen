// 避雷針 / Lightning Rod — demo data. Every shop below is FICTIONAL (names invented, locations approximate)
// so the demo never puts a real business next to a complaint.
(function (root) {
  const { EN } = root.BLZ_I18N;
  const DIMS_ZH = {
    food:    { label: '食物', icon: '🍜', tags: ['太鹹', '太油', '份量少', '食材不新鮮', '和照片差很多', '上菜是冷的', '吃完肚子不舒服'] },
    service: { label: '服務', icon: '🙋', tags: ['態度冷淡', '上菜很慢', '點錯餐', '一直催人', '強制低消', '叫不到人'] },
    space:   { label: '環境', icon: '🪑', tags: ['很吵', '桌面黏黏的', '座位很擠', '冷氣太冷', '沒冷氣很熱', '廁所不乾淨', '有看到蟲'] },
    access:  { label: '交通', icon: '🚇', tags: ['很難停車', '排隊超久', '入口很難找', '離捷運很遠', '不能訂位'] },
    price:   { label: '價格', icon: '💸', tags: ['CP 值低', '服務費沒先說', '加點很貴', '價格沒標清楚'] },
  };

  // Tag → a line someone might actually write, and a constructive suggestion.
  const LINES_ZH = {
    '太鹹': ['湯頭鹹到要一直喝水，後半碗喝不下去。', '希望可以提供「少鹽」選項'],
    '太油': ['炒飯盤底一層油，吃完很膩。', '希望油可以少一點點'],
    '份量少': ['價錢不便宜但份量只有一般的一半。', '希望菜單上可以標示份量或克數'],
    '食材不新鮮': ['生魚片有點腥，口感也不 Q。', '希望可以再確認一下食材進貨日期'],
    '和照片差很多': ['菜單照片滿滿配料，實際上只有三片肉。', '希望菜單照片可以跟實際一樣'],
    '上菜是冷的': ['主餐上來的時候已經是溫的了。', '希望出餐可以等到一起再上'],
    '吃完肚子不舒服': ['同行兩個人回家都跑廁所。', '希望可以檢查一下冷藏溫度'],
    '態度冷淡': ['問問題店員只回「不知道」。', '希望忙的時候也可以多一句解釋'],
    '上菜很慢': ['等了 40 分鐘，隔壁晚來的先上。', '希望可以先告知大概要等多久'],
    '點錯餐': ['點不辣上辣的，換了一次還是錯。', '希望點完可以複誦一次'],
    '一直催人': ['吃到一半就來問「要不要先結帳」。', '希望用餐時間可以先講清楚'],
    '強制低消': ['一人低消 300，進門前沒有講。', '希望低消可以貼在門口'],
    '叫不到人': ['舉手五分鐘都沒有人來。', '希望可以放服務鈴'],
    '很吵': ['音樂很大聲，對面講話都聽不到。', '希望音樂可以小聲一點'],
    '桌面黏黏的': ['桌子摸起來黏黏的，菜單也是。', '希望翻桌時可以擦乾一點'],
    '座位很擠': ['椅子背貼著背，包包沒地方放。', '希望可以放置物籃'],
    '冷氣太冷': ['冷到外套脫不下來。', '希望可以調高一兩度'],
    '沒冷氣很熱': ['夏天吃鍋完全是在三溫暖。', '希望可以加台電扇'],
    '廁所不乾淨': ['廁所沒有衛生紙，地板濕的。', '希望可以多巡幾次廁所'],
    '有看到蟲': ['牆角有小強經過。', '希望可以做一次除蟲'],
    '很難停車': ['附近完全沒車位，繞了 20 分鐘。', '希望可以推薦附近停車場'],
    '排隊超久': ['平日晚上也排了一個小時。', '希望可以用線上候位'],
    '入口很難找': ['在巷子裡的二樓，招牌很小。', '希望巷口可以放個指標'],
    '離捷運很遠': ['下捷運要走 15 分鐘，下雨很痛苦。', '希望網站可以寫一下怎麼走'],
    '不能訂位': ['只收現場，帶長輩等很辛苦。', '希望可以開放部分訂位'],
    'CP 值低': ['一碗 380 就是普通的麵。', '希望可以有平價一點的選項'],
    '服務費沒先說': ['結帳多了 10%，菜單上沒寫。', '希望服務費可以標在菜單上'],
    '加點很貴': ['加一份白飯 50 元。', '希望加點價格可以更合理'],
    '價格沒標清楚': ['時價海鮮結帳才知道多少。', '希望時價可以先告知'],
  };

  // English: same tags, keyed by the Chinese one. [tag, line, suggestion]
  const TAGS_EN = {
    '太鹹': ['Too salty', 'The broth was so salty I kept drinking water and couldn\'t finish it.', 'A "less salt" option would be great'],
    '太油': ['Too oily', 'A layer of oil at the bottom of the fried rice plate. Very heavy.', 'A little less oil, please'],
    '份量少': ['Small portions', 'Not cheap, but the portion was half the usual size.', 'Show portion sizes or grams on the menu'],
    '食材不新鮮': ['Not fresh', 'The sashimi smelled a bit fishy and was mushy.', 'Please double-check ingredient delivery dates'],
    '和照片差很多': ['Nothing like the photo', 'The menu photo was piled with toppings; I got three slices of meat.', 'Make menu photos match the real dish'],
    '上菜是冷的': ['Served cold', 'The main course was already lukewarm when it arrived.', 'Send dishes out together when they\'re ready'],
    '吃完肚子不舒服': ['Upset stomach after', 'Both of us had stomach trouble after getting home.', 'Please check fridge temperatures'],
    '態度冷淡': ['Cold attitude', 'Asked a question and the staff just said "don\'t know".', 'A short explanation helps, even when busy'],
    '上菜很慢': ['Slow service', 'Waited 40 minutes; the table that came after us got food first.', 'Let people know roughly how long the wait is'],
    '點錯餐': ['Wrong order', 'Ordered not spicy, got spicy — twice.', 'Read the order back after taking it'],
    '一直催人': ['Rushed us out', 'Halfway through the meal they asked if we wanted to pay already.', 'Tell people the time limit up front'],
    '強制低消': ['Surprise minimum spend', 'NT$300 minimum per person, not mentioned before we sat down.', 'Post the minimum spend at the door'],
    '叫不到人': ['Hard to get attention', 'Hand up for five minutes and nobody came.', 'A call button on each table would help'],
    '很吵': ['Very loud', 'The music was so loud we couldn\'t hear each other.', 'Turn the music down a little'],
    '桌面黏黏的': ['Sticky tables', 'The table was sticky, and so was the menu.', 'Wipe tables dry between guests'],
    '座位很擠': ['Cramped seating', 'Chairs back to back, nowhere to put a bag.', 'Add baskets for bags'],
    '冷氣太冷': ['AC too cold', 'So cold I couldn\'t take my jacket off.', 'Raise the AC a degree or two'],
    '沒冷氣很熱': ['No AC, very hot', 'Hot pot in summer felt like a sauna.', 'Add a fan or two'],
    '廁所不乾淨': ['Dirty restroom', 'No toilet paper and a wet floor.', 'Check the restroom more often'],
    '有看到蟲': ['Saw bugs', 'A cockroach ran along the wall.', 'Get pest control in'],
    '很難停車': ['Hard to park', 'No parking anywhere nearby; circled for 20 minutes.', 'Suggest a nearby parking lot'],
    '排隊超久': ['Very long queue', 'Waited an hour, even on a weekday evening.', 'Add an online waitlist'],
    '入口很難找': ['Hard to find', 'Second floor down an alley, with a tiny sign.', 'Put a sign at the end of the alley'],
    '離捷運很遠': ['Far from the MRT', '15-minute walk from the MRT, miserable in the rain.', 'Add directions on your website'],
    '不能訂位': ['No reservations', 'Walk-in only — hard when you bring older relatives.', 'Open up some reservations'],
    'CP 值低': ['Poor value', 'NT$380 for a pretty ordinary bowl of noodles.', 'Offer a more affordable option'],
    '服務費沒先說': ['Hidden service charge', 'An extra 10% at checkout that wasn\'t on the menu.', 'Put the service charge on the menu'],
    '加點很貴': ['Pricey add-ons', 'NT$50 for an extra bowl of rice.', 'Make add-on prices more reasonable'],
    '價格沒標清楚': ['Prices not shown', 'Market-price seafood — we only found out the price at checkout.', 'Tell people market prices before ordering'],
  };
  const DIM_EN = { food: 'Food', service: 'Service', space: 'Space', access: 'Getting there', price: 'Price' };
  // Fictional shops in English: [name, cuisine, area, merchant reply]
  const SHOPS_EN = [
    ['Kirishima Ramen Lab', 'Ramen', 'Daan', 'You can now choose a "light" broth. Thank you all for the feedback!'],
    ["Grandma's Kitchen", 'Taiwanese', 'Zhongshan'],
    ['Brunch & Bloom', 'Brunch', 'Xinyi', 'The minimum spend is now on the door and the first page of the menu. Sorry for the trouble.'],
    ['Old House Curry', 'Curry', 'Songshan', 'There\'s a yellow sign at the end of the alley now. Call us if you can\'t find us 🙏'],
    ['Harbor Seafood', 'Seafood', 'Wanhua'],
    ['Alley Pasta', 'Italian', 'Daan'],
    ['Night Owl Izakaya', 'Izakaya', 'Zhongshan'],
    ['Hillside Veggie', 'Vegetarian', 'Daan'],
    ['East Side BBQ King', 'BBQ', 'Xinyi'],
    ['Morning Light Soy Milk', 'Breakfast', 'Zhongzheng'],
    ['Red Brick Beef Noodles', 'Beef noodles', 'Zhongzheng'],
    ['Little Nanyang Kitchen', 'Southeast Asian', 'Zhonghe'],
    ['Forest Dessert Room', 'Desserts', 'Songshan'],
    ['Dadaocheng Braised Pork Rice', 'Street food', 'Datong', 'We now have monthly pest control and new tables.'],
    ['Dinghao Hot Pot', 'Hot pot', 'Daan'],
    ['HK Diner', 'Hong Kong', 'Zhongshan'],
    ['Alley Taco', 'Mexican', 'Daan'],
    ['Century Dumplings', 'Noodles & dumplings', 'Zhongzheng'],
    ['Tianmu Bistro', 'Sichuan', 'Shilin'],
    ['Riverside Café', 'Coffee', 'Dadaocheng'],
    ['Rooftop Korean BBQ', 'Korean', 'Xinyi'],
    ['Kyoto Donburi House', 'Japanese', 'Zhongshan'],
    ['Gongguan Fried Chicken', 'Street food', 'Zhongzheng'],
    ['Cloud Pancakes', 'Desserts', 'Daan'],
  ];
  const USERS_EN = ['Foodie May', 'Office worker Chen', 'Leo in Taipei', 'Hungry Jigglypuff', 'Weekend explorer', 'Island', 'Veggie Ivy', 'Late-night researcher', 'Ken (eats with grandparents)',
    'Cooks > delivery', 'Jay', 'Dessert-stomach Mia', 'Scooter Shawn', 'Table for one', 'Zhe from Tainan', 'Jia', 'Hsu', 'Budget queen'];

  const DIMS = {};
  for (const [k, d] of Object.entries(DIMS_ZH)) {
    DIMS[k] = EN ? { label: DIM_EN[k], icon: d.icon, tags: d.tags.map((t) => TAGS_EN[t][0]) } : d;
  }
  const LINES = EN ? Object.fromEntries(Object.values(TAGS_EN).map(([t, line, sug]) => [t, [line, sug]])) : LINES_ZH;
  const tagOf = (t) => (EN ? TAGS_EN[t][0] : t);

  // [name, cuisine, area, lat, lng, price, problem profile, merchant reply?, improved dims?]
  const SHOPS = [
    ['霧島拉麵研究所', '拉麵', '大安', 25.0418, 121.5436, '$$', { food: ['太鹹', '太鹹', '太油'], access: ['排隊超久', '排隊超久', '排隊超久', '不能訂位'] }, '湯頭我們已經調整為可選「淡味」，謝謝大家的回饋！', ['food']],
    ['阿嬤灶腳', '台菜', '中山', 25.0529, 121.5207, '$', { space: ['沒冷氣很熱', '沒冷氣很熱', '座位很擠'], service: ['上菜很慢'] }],
    ['Brunch & Bloom', '早午餐', '信義', 25.0365, 121.5652, '$$$', { price: ['服務費沒先說', 'CP 值低', 'CP 值低'], service: ['一直催人', '一直催人', '強制低消'] }, '低消已貼在門口與菜單第一頁，造成困擾很抱歉。'],
    ['老宅咖哩', '咖哩', '松山', 25.0503, 121.5598, '$$', { access: ['入口很難找', '入口很難找', '入口很難找'] }, '巷口已經放了一個黃色立牌，找不到歡迎打電話給我們 🙏', ['access']],
    ['海口人海鮮', '海鮮', '萬華', 25.0360, 121.4999, '$$$', { price: ['價格沒標清楚', '價格沒標清楚', '價格沒標清楚', 'CP 值低'], food: ['食材不新鮮', '食材不新鮮'] }],
    ['小巷義麵', '義式', '大安', 25.0330, 121.5520, '$$', { food: ['和照片差很多', '份量少', '份量少'] }],
    ['夜貓子居酒屋', '居酒屋', '中山', 25.0580, 121.5250, '$$$', { space: ['很吵', '很吵', '很吵', '很吵'], service: ['叫不到人', '叫不到人'] }],
    ['山丘蔬食', '蔬食', '大安', 25.0262, 121.5431, '$$', { service: ['上菜很慢', '上菜很慢'] }],
    ['東區燒肉王', '燒肉', '信義', 25.0410, 121.5580, '$$$', { space: ['座位很擠', '廁所不乾淨', '廁所不乾淨', '廁所不乾淨'], price: ['加點很貴'] }],
    ['晨光豆漿', '早餐', '中正', 25.0330, 121.5190, '$', { access: ['排隊超久', '排隊超久'], space: ['桌面黏黏的'] }],
    ['紅磚牛肉麵', '牛肉麵', '中正', 25.0440, 121.5130, '$$', { food: ['太油', '太鹹'] }],
    ['南洋小廚', '東南亞', '中和', 25.0005, 121.5090, '$', { access: ['離捷運很遠', '很難停車', '很難停車'] }],
    ['森林甜點室', '甜點', '松山', 25.0580, 121.5510, '$$', { price: ['CP 值低', 'CP 值低'], service: ['態度冷淡'] }],
    ['大稻埕滷肉飯', '小吃', '大同', 25.0580, 121.5100, '$', { space: ['有看到蟲', '桌面黏黏的', '桌面黏黏的'] }, '已請除蟲公司每月定期處理，也換了新桌子。', ['space']],
    ['頂好火鍋', '火鍋', '大安', 25.0415, 121.5505, '$$', { service: ['點錯餐', '點錯餐', '一直催人'], space: ['冷氣太冷'] }],
    ['港仔茶餐廳', '港式', '中山', 25.0500, 121.5300, '$$', { service: ['態度冷淡', '態度冷淡', '態度冷淡', '上菜很慢'] }],
    ['巷弄 Taco', '墨西哥', '大安', 25.0290, 121.5340, '$$', { food: ['上菜是冷的'] }],
    ['百年水餃', '麵食', '中正', 25.0380, 121.5260, '$', { food: ['吃完肚子不舒服', '吃完肚子不舒服', '食材不新鮮'] }],
    ['天母小館', '川菜', '士林', 25.1180, 121.5290, '$$', { access: ['很難停車', '離捷運很遠', '不能訂位'] }],
    ['河岸咖啡', '咖啡', '大稻埕', 25.0560, 121.5080, '$$', { space: ['很吵', '座位很擠'], access: ['不能訂位'] }],
    ['頂樓韓式烤肉', '韓式', '信義', 25.0335, 121.5660, '$$$', { price: ['服務費沒先說', '加點很貴'], space: ['沒冷氣很熱', '沒冷氣很熱'] }],
    ['京都丼飯屋', '日式', '中山', 25.0475, 121.5230, '$$', { food: ['份量少', '份量少', '份量少'] }],
    ['公館鹹酥雞', '小吃', '中正', 25.0145, 121.5345, '$', { food: ['太油', '太油'], service: ['上菜很慢'] }],
    ['雲朵鬆餅', '甜點', '大安', 25.0390, 121.5480, '$$', { access: ['排隊超久', '排隊超久', '排隊超久', '排隊超久'] }],
  ];

  const USERS_ZH = ['吃貨阿May', '上班族小陳', 'Leo 在台北', '胖丁想吃飯', '週末探店人', '小島', '蔬食的 Ivy', '宵夜研究員', '帶長輩吃飯的 Ken',
    '外送不如自己來', '阿傑', '甜點胃 Mia', '機車族阿翔', '一人食', '台南來的阿哲', '嘉嘉', 'Hsu', '省錢小資女'];

  const DAY = 864e5;
  function rnd(seed) { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); }

  const USERS = EN ? USERS_EN : USERS_ZH;

  function build(now = Date.now()) {
    let seed = 1;
    const places = SHOPS.map(([name, cuisine, area, lat, lng, price, profile, reply, improved], i) => {
      if (EN) [name, cuisine, area, reply] = [SHOPS_EN[i][0], SHOPS_EN[i][1], SHOPS_EN[i][2], reply && SHOPS_EN[i][3]];
      const reviews = [];
      for (const [dim, zhTags] of Object.entries(profile)) {
        zhTags.map(tagOf).forEach((tag, j) => {
          seed++;
          const [text, suggest] = LINES[tag];
          const isImproved = improved && improved.includes(dim);
          reviews.push({
            id: `r${i}-${dim}-${j}`,
            user: USERS[Math.floor(rnd(seed) * USERS.length)],
            dim, tags: [tag], severity: 1 + Math.floor(rnd(seed + 1) * 3),
            text, suggest,
            at: now - Math.floor((isImproved ? 90 : 3) + rnd(seed + 2) * 120) * DAY,
            agree: Math.floor(rnd(seed + 3) * 14),
          });
        });
      }
      const improvements = (improved || []).map((dim) => ({
        dim, at: now - Math.floor(10 + rnd(i) * 30) * DAY, confirms: 3 + Math.floor(rnd(i + 7) * 4),
      }));
      return {
        id: 'p' + i, name, cuisine, area, lat, lng, price, reviews, demo: true,
        reply: reply ? { text: reply, at: now - Math.floor(5 + rnd(i + 3) * 40) * DAY } : null,
        improvements,
      };
    });
    return places;
  }

  root.BLZ_DATA = { DIMS, LINES, build };
})(window);
