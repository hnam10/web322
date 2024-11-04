/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs"], // 'views' 폴더의 모든 .ejs 파일을 감지

  theme: {
    extend: {}, // Tailwind 기본 테마 확장
  },

  plugins: [
    require("@tailwindcss/typography"), // typography 플러그인 추가
    require("daisyui"), // daisyUI 플러그인 추가
  ],

  daisyui: {
    themes: ["fantasy"], // 'fantasy' 테마 사용 설정
  },
};
