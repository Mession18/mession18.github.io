import { useState } from 'react'
import { Icon } from 'animal-island-ui'
import {
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Headphones,
  Leaf,
  MapPin,
  Sparkles,
  SquareTerminal,
  TicketsPlane,
  Utensils,
} from 'lucide-react'
import { travelStamps, type TravelStamp } from '../data/travelStamps'
import cnFlag from 'flag-icons/flags/4x3/cn.svg'
import hkFlag from 'flag-icons/flags/4x3/hk.svg'
import krFlag from 'flag-icons/flags/4x3/kr.svg'
import moFlag from 'flag-icons/flags/4x3/mo.svg'

const STAMPS_PER_PAGE = 6
const countryFlags: Record<string, string> = { cn: cnFlag, hk: hkFlag, kr: krFlag, mo: moFlag }
const mrzLines = [
  'P<WCI<MESSION<<ISLANDER<<<<<<<<<<<<<<<<<<<<<',
  'WCI0818M<8WCI0108189X3108187<<<<<<<<<<<<<<08',
]

function MachineReadableLine({ value }: { value: string }) {
  return (
    <code>
      {[...value].map((character, index) => (
        <span key={index}>{character}</span>
      ))}
    </code>
  )
}

function Stamp({ stamp }: { stamp: TravelStamp }) {
  return (
    <div
      className={`travel-stamp stamp-${stamp.color} ${stamp.shape === 'square' ? 'stamp-square' : ''}`}
      style={{ transform: `rotate(${stamp.rotation ?? 0}deg)` }}
    >
      {stamp.countryCode && countryFlags[stamp.countryCode] ? (
        <img
          className="stamp-flag"
          src={countryFlags[stamp.countryCode]}
          alt={`${stamp.countryOrRegion}旗帜`}
        />
      ) : (
        <span className="stamp-mark">{stamp.mark}</span>
      )}
      <b>{stamp.place}</b>
      <small>{stamp.region}</small>
      <time>{stamp.date}</time>
      {stamp.note && <em>{stamp.note}</em>}
    </div>
  )
}

function IdentityPage() {
  return (
    <div className="passport-page identity-page">
      <div className="security-guilloche" aria-hidden="true" />
      <div className="security-watermark" aria-hidden="true">
        <span>🌴</span>
        <small>WINDCHIME ISLAND</small>
      </div>
      <div className="passport-topline">
        <span>风铃岛护照 · ISLANDER PASSPORT</span>
        <b>旅行证件 / TRAVEL DOCUMENT</b>
      </div>
      <div className="document-codes">
        <p>
          <small>类型 / TYPE</small>
          <b>P</b>
        </p>
        <p>
          <small>签发代码 / CODE</small>
          <b>WCI</b>
        </p>
        <p>
          <small>护照号码 / PASSPORT NO.</small>
          <b>WCI0818M</b>
        </p>
      </div>
      <div className="passport-profile">
        <div className="passport-avatar">
          <img src="/images/avatar.png" alt="岛民头像" />
          <span>ISLANDER</span>
        </div>
        <div className="seam-seal" aria-label="风铃岛骑缝认证章">
          <Leaf size={18} />
          <b>风铃岛认证</b>
          <small>WCI · 0818</small>
        </div>
        <div className="passport-details">
          <p className="name-field">
            <small>岛民姓名 / NAME</small>
            <strong>
              MESSION <em>温柔的椰子</em>
            </strong>
          </p>
          <p>
            <small>婚姻状态 / STATUS</small>
            <strong>已婚</strong>
          </p>
          <p>
            <small>常驻地点 / LOCATION</small>
            <strong>
              <MapPin size={15} />
              烟台
            </strong>
          </p>
          <p>
            <small>加入日期 / SINCE</small>
            <strong>2001.08.18</strong>
          </p>
        </div>
      </div>
      <div className="passport-likes">
        <span>
          <Utensils size={16} /> 品尝美食
        </span>
        <span>
          <Gamepad2 size={16} /> 激情游戏
        </span>
        <span>
          <Headphones size={16} /> 优雅听歌
        </span>
        <span>
          <TicketsPlane size={16} /> 探索世界
        </span>
        <span>
          <SquareTerminal size={16} /> 敲敲代码
        </span>
      </div>
      <div className="passport-bottom">
        <p>
          持证人签名 / HOLDER'S SIGNATURE
          <br />
          <b>MESSION</b>
        </p>
      </div>
      <div className="mrz" aria-label="装饰性机器可读编码">
        {mrzLines.map((line) => (
          <MachineReadableLine key={line} value={line} />
        ))}
      </div>
    </div>
  )
}

function VisaPage({ stamps, pageNumber }: { stamps: TravelStamp[]; pageNumber: number }) {
  return (
    <div className="passport-page visa-page">
      <div className="security-guilloche" aria-hidden="true" />
      <span className="page-watermark" aria-hidden="true">
        {String(pageNumber).padStart(2, '0')}
      </span>
      <div className="passport-topline">
        <span>VISAS · 旅行签证</span>
        <b>PAGE {String(pageNumber).padStart(2, '0')}</b>
      </div>
      <div className="visa-grid">
        {stamps.map((stamp) => (
          <Stamp key={`${stamp.region}-${stamp.place}-${stamp.date}`} stamp={stamp} />
        ))}
        {stamps.length === 0 && (
          <div className="empty-visa">
            <span>✈</span>
            <b>这一页还在等一段旅程</b>
            <small>去过新的地方后，在 travelStamps.ts 添加一枚章吧</small>
          </div>
        )}
      </div>
      <div className="visa-code">
        <span>WCI · V{String(pageNumber).padStart(2, '0')} · 0818 · MESSION</span>
        <code>
          &lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
        </code>
      </div>
    </div>
  )
}

function JourneySummaryPage() {
  const regions = new Set(travelStamps.map((stamp) => stamp.countryOrRegion)).size
  return (
    <div className="passport-page summary-page">
      <div className="security-guilloche" aria-hidden="true" />
      <div className="passport-topline">
        <span>MY ISLAND JOURNEY</span>
        <b>旅途年鉴 / ARCHIVE</b>
      </div>
      <div className="summary-title">
        <Icon name="icon-miles" size={52} className="summary-title-icon" />
        <p>
          <small>温柔的椰子 · MESSION</small>
          <b>岛民旅行年鉴</b>
        </p>
      </div>
      <div className="journey-stats">
        <p>
          <b>{String(travelStamps.length).padStart(2, '0')}</b>
          <small>枚旅行章</small>
        </p>
        <p>
          <b>{String(regions).padStart(2, '0')}</b>
          <small>个国家与地区</small>
        </p>
        <p>
          <b>∞</b>
          <small>还想去的地方</small>
        </p>
      </div>
      <div className="journey-message">
        <small>旅行宣言 / TRAVEL MOTTO</small>
        <p>“不必赶路，去喜欢的地方，留下温柔的回声。”</p>
      </div>
      <div className="next-stop">
        <span>下一站 / NEXT STOP</span>
        <b>等待一阵合适的风……</b>
        <i>✈</i>
      </div>
      <div className="summary-code">
        WCI · MESSION · JOURNEY NEVER ENDS · &lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
      </div>
    </div>
  )
}

export function Passport() {
  const visaPageCount = Math.max(1, Math.ceil(travelStamps.length / STAMPS_PER_PAGE))
  const totalPages = visaPageCount + 2
  const [page, setPage] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const pageStamps = travelStamps.slice((page - 1) * STAMPS_PER_PAGE, page * STAMPS_PER_PAGE)

  function turnPage(nextPage: number) {
    if (nextPage < 0 || nextPage >= totalPages) return
    setDirection(nextPage > page ? 'next' : 'prev')
    setPage(nextPage)
  }

  return (
    <section className="passport section" id="about">
      <div className="passport-intro">
        <p className="eyebrow">ISLANDER PASSPORT</p>
        <h2>
          <Icon name="icon-variant" size={42} className="passport-heading-icon" />
          岛民护照
        </h2>
        <p>参考本式护照的横向比例、资料区和机器可读编码，制作属于风铃岛的旅行纪念册。</p>
        <div className="passport-note">
          <Sparkles size={18} />
          <span>使用上下按钮翻阅身份页与签证页</span>
        </div>
      </div>
      <div className="passport-book">
        <div className="passport-card-stage">
          <div className="passport-card-scaler">
            <article
              key={page}
              className={`passport-card page-turn-${direction}`}
              aria-label={`岛民护照第 ${page + 1} 页`}
            >
              {page === 0 ? (
                <IdentityPage />
              ) : page === totalPages - 1 ? (
                <JourneySummaryPage />
              ) : (
                <VisaPage stamps={pageStamps} pageNumber={page} />
              )}
            </article>
          </div>
        </div>
        <div className="passport-controls vertical-controls">
          <button onClick={() => turnPage(page - 1)} disabled={page === 0} aria-label="向上翻页">
            <ChevronUp size={19} />
          </button>
          <span>
            <b>{page + 1}</b> / {totalPages}
            <small>{page === 0 ? '身份页' : page === totalPages - 1 ? '年鉴页' : '签证页'}</small>
          </span>
          <button
            onClick={() => turnPage(page + 1)}
            disabled={page === totalPages - 1}
            aria-label="向下翻页"
          >
            <ChevronDown size={19} />
          </button>
        </div>
      </div>
    </section>
  )
}
