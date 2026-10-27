import { useState } from 'react';
import { Link } from 'react-router';
import { assetUrl } from '../../lib/assets.js';

const tracks = [
  { number: '01', name: '헤어 디자인', meta: '국가자격증 · 살롱 실무', copy: '커트부터 컬러, 드라이와 붙임머리까지 현장에서 바로 쓰는 기본기를 쌓아요.', tone: 'rose' },
  { number: '02', name: '네일 아트', meta: '국가자격증 · 젤 아트', copy: '기초 케어부터 트렌드 디자인, 드릴 테크닉까지 손끝의 언어를 배워요.', tone: 'lilac' },
  { number: '03', name: '피부미용', meta: '국가자격증 · 에스테틱', copy: '피부 이론과 상담, 클렌징부터 살롱 케어까지 섬세한 루틴을 완성해요.', tone: 'peach' },
  { number: '04', name: '메이크업', meta: '국가자격증 · 포트폴리오', copy: '데일리 메이크업부터 웨딩, 방송, 무대까지 나만의 시그니처를 만들어요.', tone: 'berry' },
];

const stories = [
  ['서윤', '헤어 디자인', '배우는 동안 만든 12개의 스타일 포트폴리오로 첫 살롱에 입사했어요.'],
  ['민지', '메이크업', '기초부터 다시 시작해 웨딩 메이크업 어시스턴트로 커리어를 시작했어요.'],
  ['하늘', '네일 아트', '작품 피드백과 실전 모델 수업이 가장 큰 자신감이 되었어요.'],
];

export default function AcademyPage() {
  const [consultOpen, setConsultOpen] = useState(false);
  const [activeTrack, setActiveTrack] = useState('전체');
  const filteredTracks = activeTrack === '전체' ? tracks : tracks.filter((track) => track.name.startsWith(activeTrack));

  return (
    <main className="academy-page">
      <section className="academy-hero" aria-labelledby="academy-title">
        <img src={assetUrl('/assets/beauty-academy-hero.png')} alt="미용 실습실에서 헤어 드라이를 연습하는 뷰티 학생" />
        <div className="academy-hero-wash" />
        <div className="academy-hero-copy">
          <p className="academy-kicker">BEAUTY EDUCATION · 2026</p>
          <h1 id="academy-title">나의 아름다움을<br /><em>직업</em>으로.</h1>
          <p>헤어, 네일, 피부, 메이크업.<br />좋아하는 일을 오래 할 수 있도록, 기초부터 현장까지.</p>
          <button className="academy-primary" onClick={() => setConsultOpen(true)}>무료 상담 신청 <span>↗</span></button>
        </div>
        <div className="academy-hero-note"><span>01</span><span>THE BEAUTY LAB</span><span>SEOUL · BUSAN · ONLINE</span></div>
      </section>

      <section className="academy-intro" aria-labelledby="intro-title">
        <div><p className="academy-label">WHY BEAUTY LAB</p><h2 id="intro-title">아름다움을 배우는 일은<br /><strong>나를 설계하는 일</strong>이니까.</h2></div>
        <div className="academy-intro-copy"><p>한 가지 기술만 빠르게 익히는 수업보다, 오래 사랑받는 전문가가 되는 과정을 함께 설계합니다.</p><p>국가자격증부터 살롱 실무, 포트폴리오와 취업까지 지금 필요한 다음 장면을 준비해요.</p><a href="#tracks" className="academy-text-link">교육 방식 더 알아보기 <span>↗</span></a></div>
      </section>

      <section className="academy-tracks" id="tracks" aria-labelledby="tracks-title">
        <div className="academy-section-head"><div><p className="academy-label">FIND YOUR FIELD</p><h2 id="tracks-title">배우고 싶은 분야를<br /><em>골라보세요.</em></h2></div><p>04 TRACKS<br />ONE NEXT STEP</p></div>
        <div className="academy-filter" role="group" aria-label="교육 과정 필터">
          {['전체', '헤어', '네일', '피부', '메이크업'].map((filter) => <button key={filter} className={activeTrack === filter ? 'active' : ''} onClick={() => setActiveTrack(filter)}>{filter}</button>)}
        </div>
        <div className="academy-track-grid">
          {filteredTracks.map((track) => <article className={`academy-track-card ${track.tone}`} key={track.number}><div className="academy-track-top"><span>{track.number}</span><span>↗</span></div><div><p>{track.meta}</p><h3>{track.name}</h3><span>{track.copy}</span></div><button onClick={() => setConsultOpen(true)}>과정 상담 <span>↗</span></button></article>)}
        </div>
      </section>

      <section className="academy-promo" aria-label="수강 프로모션">
        <div className="academy-promo-copy"><p className="academy-label">FIRST STEP EVENT</p><h2>처음이라서 더 좋은<br /><em>뷰티 스타터 패키지</em></h2><p>입문 상담 · 레벨 테스트 · 개인별 커리큘럼 제안까지<br />첫 상담을 신청한 분께 무료로 제공합니다.</p><button className="academy-light-button" onClick={() => setConsultOpen(true)}>스타터 패키지 받기 <span>↗</span></button></div>
        <div className="academy-promo-art"><div className="academy-promo-orb">START<br /><small>YOUR<br />BEAUTY</small></div><div className="academy-promo-sticker">FREE<br />CONSULT</div></div>
      </section>

      <section className="academy-proof" aria-labelledby="proof-title"><div className="academy-section-head"><div><p className="academy-label">MORE THAN A CLASS</p><h2 id="proof-title">배운 만큼<br /><em>달라지는 내일.</em></h2></div><p>STUDENT<br />STORIES</p></div><div className="academy-story-grid">{stories.map(([name, field, copy]) => <article className="academy-story" key={name}><div className="academy-story-avatar">{name.slice(0, 1)}</div><p>{field} · 2026</p><h3>“{copy}”</h3><span>{name} 수강생</span></article>)}</div></section>

      <section className="academy-bottom-cta"><p className="academy-label">READY WHEN YOU ARE</p><h2>좋아하는 일을<br /><em>잘하는 일</em>로.</h2><button className="academy-primary" onClick={() => setConsultOpen(true)}>무료 상담 신청 <span>↗</span></button></section>

      {consultOpen && <div className="academy-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setConsultOpen(false)}><section className="academy-modal" role="dialog" aria-modal="true" aria-labelledby="consult-title"><button className="academy-modal-close" aria-label="상담 신청 닫기" onClick={() => setConsultOpen(false)}>×</button><p className="academy-label">FREE CONSULTATION</p><h2 id="consult-title">어떤 분야가<br /><em>궁금하세요?</em></h2><form onSubmit={(event) => { event.preventDefault(); setConsultOpen(false); }}><label htmlFor="academy-name">이름<input id="academy-name" required placeholder="이름을 입력해주세요" /></label><label htmlFor="academy-phone">연락처<input id="academy-phone" required type="tel" placeholder="010-0000-0000" /></label><label htmlFor="academy-field">관심 과정<select id="academy-field" defaultValue="헤어 디자인"><option>헤어 디자인</option><option>네일 아트</option><option>피부미용</option><option>메이크업</option><option>붙임머리</option></select></label><button className="academy-primary" type="submit">상담 신청하기 <span>↗</span></button></form></section></div>}
    </main>
  );
}
