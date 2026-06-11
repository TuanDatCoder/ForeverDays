const { createClient } = require('@supabase/supabase-js');

// Must provide valid service_role or anon key with RLS policies allowing inserts
const url = 'https://cigigyfpiadyabyrbujc.supabase.co';
const anonKey = 'sb_publishable_OvwP_BkKRKP3_pdn0n1y8g_bWNRkvxy';
const supabase = createClient(url, anonKey);

const vietnamProvinces = [
  "Hà Nội", "Hà Giang", "Cao Bằng", "Bắc Kạn", "Tuyên Quang", "Lào Cai", "Điện Biên", "Lai Châu", "Sơn La", "Yên Bái", "Hòa Bình", "Thái Nguyên", "Lạng Sơn", "Quảng Ninh", "Bắc Giang", "Phú Thọ", "Vĩnh Phúc", "Bắc Ninh", "Hải Dương", "Hải Phòng", "Hưng Yên", "Thái Bình", "Hà Nam", "Nam Định", "Ninh Bình", "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị", "Thừa Thiên Huế", "Đà Nẵng", "Quảng Nam", "Quảng Ngãi", "Bình Định", "Phú Yên", "Khánh Hòa", "Ninh Thuận", "Bình Thuận", "Kon Tum", "Gia Lai", "Đắk Lắk", "Đắk Nông", "Lâm Đồng", "Bình Phước", "Tây Ninh", "Bình Dương", "Đồng Nai", "Bà Rịa - Vũng Tàu", "Hồ Chí Minh", "Long An", "Tiền Giang", "Bến Tre", "Trà Vinh", "Vĩnh Long", "Đồng Tháp", "An Giang", "Kiên Giang", "Cần Thơ", "Hậu Giang", "Sóc Trăng", "Bạc Liêu", "Cà Mau"
];

const internationalCountries = [
  "Thái Lan", "Hàn Quốc", "Nhật Bản", "Singapore", "Malaysia", "Trung Quốc", "Đài Loan", "Pháp", "Mỹ", "Úc"
];

async function seed() {
  console.log('Start seeding travel_locations...');
  
  // Create an array of objects
  const inserts = [];
  
  for (const p of vietnamProvinces) {
    inserts.push({
      name: p,
      type: 'province',
      country: 'Việt Nam',
      image_url: `https://source.unsplash.com/800x600/?${encodeURIComponent(p.replace(/ /g, '-').replace(/đ/g, 'd').replace(/Đ/g, 'D'))},vietnam,travel`
    });
  }
  
  for (const c of internationalCountries) {
    inserts.push({
      name: c,
      type: 'country',
      country: c,
      image_url: `https://source.unsplash.com/800x600/?${encodeURIComponent(c.replace(/ /g, '-'))},travel,landscape`
    });
  }

  const { data, error } = await supabase.from('travel_locations').insert(inserts);
  
  if (error) {
    console.error('Error inserting data:', error);
  } else {
    console.log(`Successfully inserted ${inserts.length} locations!`);
  }
}

seed();
