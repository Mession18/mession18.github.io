import { setting, settingStyle } from '../../shared/site-settings'
import { Icon } from 'animal-island-ui'
import {
  Gamepad2,
  Headphones,
  Leaf,
  MapPin,
  SquareTerminal,
  TicketsPlane,
  TreePalm,
  Utensils,
} from 'lucide-react'
import { lazy, Suspense } from 'react'
import { TravelStamp } from '../../components/travel-stamp/TravelStamp'
import { STAMPS_PER_PAGE } from './passport.data'
import { passportTravelStamps, type TravelStamp as TravelStampData } from './travel-stamps.data'
import {
  PassportBook,
  PassportCoverPreview,
  type PassportLeaf,
  type PassportSpread,
} from './PassportBook'

const JourneyMap = lazy(() => import('./journey-map/JourneyMap'))

/** 把装饰性机器可读编码逐字符排列，使护照底部字距均匀。 */
function MachineReadableLine({ value }: { value: string }) {
  return (
    <code style={settingStyle('profile.mrz')}>
      {[...value].map((character, index) => (
        <span key={index} style={settingStyle('profile.likes')}>
          {character}
        </span>
      ))}
    </code>
  )
}

/** 护照身份页；修改姓名、地点、头像、兴趣和签名时编辑这里。 */
function IdentityPage() {
  return (
    <div className="passport-page identity-page">
      <div className="security-guilloche" aria-hidden="true" />
      <div className="security-watermark" aria-hidden="true">
        <span>🌴</span>
        <small style={settingStyle('profile.islandEnglish')}>
          {setting('profile.islandEnglish')}
        </small>
      </div>
      <div className="passport-topline">
        <span style={settingStyle('profile.heading')}>{setting('profile.heading')}</span>
        <b>旅行证件 / TRAVEL DOCUMENT</b>
      </div>
      <div className="document-codes">
        <p>
          <small>类型 / TYPE</small>
          <b style={settingStyle('profile.type')}>{setting('profile.type')}</b>
        </p>
        <p>
          <small>签发代码 / CODE</small>
          <b style={settingStyle('profile.code')}>{setting('profile.code')}</b>
        </p>
        <p>
          <small>护照号码 / PASSPORT NO.</small>
          <b style={settingStyle('profile.number')}>{setting('profile.number')}</b>
        </p>
      </div>
      <div className="passport-profile">
        <div className="passport-avatar">
          <img
            src={setting('profile.avatar')}
            alt="岛民头像"
            width={240}
            height={240}
            decoding="async"
          />
          <span>ISLANDER</span>
        </div>
        <div className="seam-seal" aria-label="风铃岛骑缝认证章">
          <Leaf size={18} />
          <b style={settingStyle('profile.sealLabel')}>{setting('profile.sealLabel')}</b>
          <small style={settingStyle('profile.sealCode')}>{setting('profile.sealCode')}</small>
        </div>
        <div className="passport-details">
          <p className="name-field">
            <small>岛民姓名 / NAME</small>
            <strong>
              <span style={settingStyle('profile.name')}>{setting('profile.name')}</span>{' '}
              <em style={settingStyle('profile.nickname')}>{setting('profile.nickname')}</em>
            </strong>
          </p>
          <p>
            <small>婚姻状态 / STATUS</small>
            <strong style={settingStyle('profile.status')}>{setting('profile.status')}</strong>
          </p>
          <p>
            <small>常驻地点 / LOCATION</small>
            <strong>
              <MapPin size={15} />
              <span style={settingStyle('profile.location')}>{setting('profile.location')}</span>
            </strong>
          </p>
          <p>
            <small>加入日期 / SINCE</small>
            <strong style={settingStyle('profile.since')}>{setting('profile.since')}</strong>
          </p>
        </div>
      </div>
      <div className="passport-likes" style={settingStyle('profile.likes')}>
        {setting('profile.likes')
          .split('\n')
          .filter(Boolean)
          .map((text, index) => {
            const LikeIcon = [Utensils, Gamepad2, Headphones, TicketsPlane, SquareTerminal][
              index % 5
            ]
            return (
              <span key={index} style={settingStyle('profile.likes')}>
                <LikeIcon size={16} /> {text}
              </span>
            )
          })}
      </div>
      <div className="passport-bottom">
        <p>
          持证人签名 / HOLDER'S SIGNATURE
          <br />
          <b style={settingStyle('profile.signature')}>{setting('profile.signature')}</b>
        </p>
      </div>
      <div className="mrz" aria-label="装饰性机器可读编码">
        {setting('profile.mrz')
          .split('\n')
          .map((line) => (
            <MachineReadableLine key={line} value={line} />
          ))}
      </div>
    </div>
  )
}

function VisaPage({ stamps, pageNumber }: { stamps: TravelStampData[]; pageNumber: number }) {
  return (
    <div className="passport-page visa-page">
      <div className="security-guilloche" aria-hidden="true" />
      <span className="page-watermark" aria-hidden="true">
        {String(pageNumber).padStart(2, '0')}
      </span>
      <div className="passport-topline visa-heading">VISA</div>
      <div className="visa-grid">
        {stamps.map((stamp) => (
          <TravelStamp
            key={
              stamp.id ??
              `${stamp.countryOrRegion}-${stamp.province}-${stamp.city}-${stamp.startDate}`
            }
            stamp={stamp}
            linkToArticle
          />
        ))}
        {stamps.length === 0 && (
          <div className="empty-visa">
            <span>✈</span>
            <b style={settingStyle('passport.emptyTitle')}>{setting('passport.emptyTitle')}</b>
            <small style={settingStyle('passport.emptyDescription')}>
              {setting('passport.emptyDescription')}
            </small>
          </div>
        )}
      </div>
      <div className="visa-code">
        <span>
          {setting('profile.code')} · V{String(pageNumber).padStart(2, '0')} · 0818 ·{' '}
          {setting('profile.name')}
        </span>
      </div>
    </div>
  )
}

function JourneySummaryPage() {
  const regions = new Set(passportTravelStamps.map((stamp) => stamp.countryOrRegion)).size
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
          <small>
            {setting('profile.nickname')} · {setting('profile.name')}
          </small>
          <b style={settingStyle('passport.archive')}>{setting('passport.archive')}</b>
        </p>
      </div>
      <div className="journey-stats">
        <p>
          <b>{String(passportTravelStamps.length).padStart(2, '0')}</b>
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
        <p style={settingStyle('passport.motto')}>{setting('passport.motto')}</p>
      </div>
      <div className="next-stop">
        <span>下一站 / NEXT STOP</span>
        <b style={settingStyle('passport.nextStop')}>{setting('passport.nextStop')}</b>
        <i>✈</i>
      </div>
      <div className="summary-code">
        {setting('profile.code')} · {setting('profile.name')} · JOURNEY NEVER ENDS ·
        &lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
      </div>
    </div>
  )
}

/** 签证从第三页起，补齐双页后接地图；年鉴位于末跨页左侧。 */
export function Passport({ standalone = false }: { standalone?: boolean }) {
  if (!standalone) return <PassportCoverPreview />
  const visaPageCount = Math.max(1, Math.ceil(passportTravelStamps.length / STAMPS_PER_PAGE))
  const visaLeaves: PassportLeaf[] = Array.from({ length: visaPageCount }, (_, index) => ({
    id: 'visa-' + index,
    label: '签证页',
    content: (
      <VisaPage
        stamps={passportTravelStamps.slice(index * STAMPS_PER_PAGE, (index + 1) * STAMPS_PER_PAGE)}
        pageNumber={index + 3}
      />
    ),
  }))
  if (visaLeaves.length % 2)
    visaLeaves.push({
      id: 'visa-blank',
      label: '签证页',
      content: <VisaPage stamps={[]} pageNumber={visaLeaves.length + 3} />,
    })
  const spreads: PassportSpread[] = [
    {
      id: 'identity',
      label: '封面背面 · 资料页',
      firstPage: 1,
      leaves: [
        {
          id: 'inside-front',
          label: '封面背面',
          insideCover: true,
          content: (
            <div className="passport-inside-cover">
              <TreePalm size={90} strokeWidth={1} />
              <p style={settingStyle('profile.islandEnglish')}>
                {setting('profile.islandEnglish')}
              </p>
              <span>{setting('profile.islandName')} · 岛民旅行证件</span>
            </div>
          ),
        },
        {
          id: 'identity',
          label: '资料页',
          landscape: true,
          acrylic: true,
          content: <IdentityPage />,
        },
      ],
    },
  ]
  for (let index = 0; index < visaLeaves.length; index += 2) {
    spreads.push({
      id: visaLeaves[index].id,
      label: '旅行签证',
      firstPage: index + 3,
      leaves: visaLeaves.slice(index, index + 2),
    })
  }
  const mapPage = visaLeaves.length + 3
  for (const [index, variant] of (['world', 'china'] as const).entries()) {
    spreads.push({
      id: variant + '-map',
      label: variant === 'world' ? '世界地图' : '中国地图',
      firstPage: mapPage + index * 2,
      content: (
        <Suspense
          fallback={
            <div className="passport-map-loading" role="status">
              正在展开旅行地图…
            </div>
          }
        >
          <JourneyMap stamps={passportTravelStamps} embedded variant={variant} />
        </Suspense>
      ),
    })
  }
  spreads.push({
    id: 'summary',
    label: '旅行年鉴',
    firstPage: mapPage + 4,
    leaves: [
      { id: 'summary', label: '旅行年鉴', landscape: true, content: <JourneySummaryPage /> },
      {
        id: 'journey-endpaper',
        label: '封底背面',
        insideCover: true,
        content: (
          <div className="passport-endpaper">
            <TreePalm size={54} strokeWidth={1} />
            <p style={{ ...settingStyle('passport.endpaper'), whiteSpace: 'pre-line' }}>
              {setting('passport.endpaper')}
            </p>
            <small>JOURNEY NEVER ENDS</small>
          </div>
        ),
      },
    ],
  })
  return (
    <section className="passport section passport-standalone" id="about">
      <div className="passport-intro">
        <h2>
          <Icon name="icon-variant" size={42} className="passport-heading-icon" />
          <span style={settingStyle('passport.title')}>{setting('passport.title')}</span>
        </h2>
        <p style={settingStyle('passport.description')}>{setting('passport.description')}</p>
      </div>
      <PassportBook spreads={spreads} />
    </section>
  )
}
