import { Chemical, Experiment } from './types';

export const CHEMICALS: Chemical[] = [
  {
    id: 'hcl',
    name: 'Axit Clohidric',
    formula: 'HCl',
    color: '#e2e8f0',
    state: 'liquid',
    properties: 'Axit mạnh, không màu, mùi xốc.',
    concentration: '1M',
    safetyWarnings: ['Ăn mòn mạnh', 'Tránh tiếp xúc với da'],
    description: 'Axit vô cơ mạnh phổ biến nhất.'
  },
  {
    id: 'h2so4',
    name: 'Axit Sunfuric',
    formula: 'H2SO4',
    color: '#f1f5f9',
    state: 'liquid',
    properties: 'Axit mạnh, háo nước.',
    concentration: '1M',
    safetyWarnings: ['Ăn mòn cực mạnh', 'Gây bỏng nặng'],
    description: 'Vua của các loại hóa chất.'
  },
  {
    id: 'hno3',
    name: 'Axit Nitric',
    formula: 'HNO3',
    color: '#fff7ed',
    state: 'liquid',
    properties: 'Axit mạnh, tính oxy hóa cao.',
    concentration: '1M',
    safetyWarnings: ['Ăn mòn mạnh', 'Oxy hóa mạnh'],
    description: 'Dùng để hòa tan nhiều kim loại.'
  },
  {
    id: 'naoh',
    name: 'Natri Hidroxit',
    formula: 'NaOH',
    color: '#f8fafc',
    state: 'liquid',
    properties: 'Bazơ mạnh, không màu.',
    concentration: '1M',
    safetyWarnings: ['Ăn mòn mạnh', 'Gây bỏng'],
    description: 'Xút ăn da.'
  },
  {
    id: 'koh',
    name: 'Kali Hidroxit',
    formula: 'KOH',
    color: '#f8fafc',
    state: 'liquid',
    properties: 'Bazơ mạnh.',
    concentration: '1M',
    safetyWarnings: ['Ăn mòn mạnh'],
    description: 'Tương tự NaOH nhưng hoạt động mạnh hơn.'
  },
  {
    id: 'caoh2',
    name: 'Canxi Hidroxit',
    formula: 'Ca(OH)2',
    color: '#ffffff',
    state: 'liquid',
    properties: 'Nước vôi trong.',
    concentration: 'Bão hòa',
    safetyWarnings: ['Kích ứng'],
    description: 'Dùng để nhận biết khí CO2.'
  },
  {
    id: 'bacl2',
    name: 'Bari Clorua',
    formula: 'BaCl2',
    color: '#f1f5f9',
    state: 'liquid',
    properties: 'Dùng nhận biết gốc sunfat.',
    concentration: '0.1M',
    safetyWarnings: ['Rất độc'],
    description: 'Tạo kết tủa trắng với H2SO4.'
  },
  {
    id: 'agno3',
    name: 'Bạc Nitrat',
    formula: 'AgNO3',
    color: '#f8fafc',
    state: 'liquid',
    properties: 'Dùng nhận biết gốc clorua.',
    concentration: '0.1M',
    safetyWarnings: ['Độc', 'Gây đen da'],
    description: 'Tạo kết tủa trắng với HCl.'
  },
  {
    id: 'cuso4',
    name: 'Đồng(II) Sunfat',
    formula: 'CuSO4',
    color: '#3b82f6',
    state: 'liquid',
    properties: 'Dung dịch màu xanh lam.',
    concentration: '0.5M',
    safetyWarnings: ['Độc'],
    description: 'Muối đồng phổ biến.'
  },
  {
    id: 'fecl3',
    name: 'Sắt(III) Clorua',
    formula: 'FeCl3',
    color: '#fde68a',
    state: 'liquid',
    properties: 'Dung dịch vàng nâu.',
    concentration: '0.1M',
    safetyWarnings: ['Ăn mòn'],
    description: 'Dùng trong nhiều phản ứng vô cơ.'
  },
  {
    id: 'kmno4',
    name: 'Kali Pemanganat',
    formula: 'KMnO4',
    color: '#a21caf',
    state: 'liquid',
    properties: 'Thuốc tím, tím đậm.',
    concentration: '0.01M',
    safetyWarnings: ['Oxy hóa mạnh'],
    description: 'Chất oxy hóa mạnh.'
  },
  {
    id: 'na2co3',
    name: 'Natri Cacbonat',
    formula: 'Na2CO3',
    color: '#f8fafc',
    state: 'liquid',
    properties: 'Muối của axit yếu.',
    concentration: '0.5M',
    safetyWarnings: ['Kích ứng'],
    description: 'Soda.'
  },
  {
    id: 'ki',
    name: 'Kali Iodua',
    formula: 'KI',
    color: '#f8fafc',
    state: 'liquid',
    properties: 'Dùng nhận biết hồ tinh bột.',
    concentration: '0.1M',
    safetyWarnings: ['Tránh ánh sáng'],
    description: 'Nguồn cung cấp ion I-.'
  },
  {
    id: 'fe',
    name: 'Sắt',
    formula: 'Fe',
    color: '#64748b',
    state: 'solid',
    properties: 'Kim loại xám.',
    safetyWarnings: ['Dễ cháy ở dạng bột'],
    description: 'Kim loại phổ biến.'
  },
  {
    id: 'zn',
    name: 'Kẽm',
    formula: 'Zn',
    color: '#94a3b8',
    state: 'solid',
    properties: 'Kim loại xám xanh.',
    safetyWarnings: ['Tránh hít bụi'],
    description: 'Dùng điều chế H2 trong PTN.'
  },
  {
    id: 'cu',
    name: 'Đồng',
    formula: 'Cu',
    color: '#b45309',
    state: 'solid',
    properties: 'Kim loại đỏ cam.',
    safetyWarnings: ['An toàn'],
    description: 'Dẫn điện tốt.'
  },
  {
    id: 'al',
    name: 'Nhôm',
    formula: 'Al',
    color: '#cbd5e1',
    state: 'solid',
    properties: 'Kim loại trắng bạc.',
    safetyWarnings: ['An toàn'],
    description: 'Nhẹ, bền.'
  },
  {
    id: 'mg',
    name: 'Magie',
    formula: 'Mg',
    color: '#e2e8f0',
    state: 'solid',
    properties: 'Cháy sáng rực rỡ.',
    safetyWarnings: ['Dễ cháy'],
    description: 'Kim loại hoạt động mạnh.'
  },
  {
    id: 'litmus',
    name: 'Quỳ tím',
    formula: 'Litmus',
    color: '#8b5cf6',
    state: 'liquid',
    properties: 'Chỉ thị màu.',
    safetyWarnings: ['An toàn'],
    description: 'Đỏ trong axit, xanh trong bazơ.'
  },
  {
    id: 'phenolphthalein',
    name: 'Phenolphthalein',
    formula: 'Phth',
    color: '#ffffff',
    state: 'liquid',
    properties: 'Chỉ thị màu.',
    safetyWarnings: ['An toàn'],
    description: 'Hồng trong bazơ.'
  },
  {
    id: 'methylorange',
    name: 'Methyl Da cam',
    formula: 'MeOr',
    color: '#f97316',
    state: 'liquid',
    properties: 'Chỉ thị màu.',
    safetyWarnings: ['An toàn'],
    description: 'Đỏ trong axit mạnh, vàng trong bazơ.'
  }
];

export const EXPERIMENTS: Experiment[] = [
  {
    id: 'exp1',
    title: 'Phản ứng Trung hòa',
    description: 'Cho dung dịch HCl tác dụng với dung dịch NaOH có mặt Phenolphthalein.',
    chemicals: ['hcl', 'naoh', 'phenolphthalein'],
    steps: [
      'Cho 5ml NaOH vào cốc thủy tinh.',
      'Thêm 1-2 giọt Phenolphthalein (dung dịch chuyển hồng).',
      'Nhỏ từ từ HCl vào cốc và khuấy đều cho đến khi mất màu.'
    ],
    expectedResult: 'Dung dịch từ màu hồng chuyển sang không màu.',
    equation: 'HCl + NaOH → NaCl + H2O'
  },
  {
    id: 'exp2',
    title: 'Sắt tác dụng với Axit',
    description: 'Cho đinh sắt vào dung dịch HCl.',
    chemicals: ['fe', 'hcl'],
    steps: [
      'Cho 5ml HCl vào ống nghiệm.',
      'Thả một ít bột sắt hoặc đinh sắt vào.'
    ],
    expectedResult: 'Có bọt khí sủi lên, đinh sắt tan dần.',
    equation: 'Fe + 2HCl → FeCl2 + H2↑'
  }
];

export const SUBJECTS = [
  { id: 'voco', name: 'Hóa học Vô cơ', icon: 'Beaker', questionsCount: 15 },
  { id: 'huuco', name: 'Hóa học Hữu cơ', icon: 'Leaf', questionsCount: 12 },
  { id: 'phantich', name: 'Hóa học Phân tích', icon: 'Search', questionsCount: 10 },
  { id: 'lythuyet', name: 'Lý thuyết Cơ bản', icon: 'Book', questionsCount: 20 }
];
