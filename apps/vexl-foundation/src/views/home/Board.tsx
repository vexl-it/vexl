import {Array} from 'effect'
import React from 'react'
import {type CopyKey} from '../../copy/copyFiles'
import {type PageCopy} from '../../copy/pageCopy'

const members = [
  {
    nameKey: 'board.lea.name',
    roleKey: 'board.lea.role',
    imageBase: '/wf/6462320cc970531b0f049a6b_Lea',
    twitter: 'https://twitter.com/LeaPetras',
    linkedin: 'https://www.linkedin.com/in/leapetras/',
  },
  {
    nameKey: 'board.stick.name',
    roleKey: 'board.stick.role',
    imageBase: '/wf/6462320c3ca951c935106a28_Stick',
    twitter: 'https://twitter.com/PavolRusnak',
    linkedin: 'https://www.linkedin.com/in/pavolrusnak/',
  },
  {
    nameKey: 'board.slush.name',
    roleKey: 'board.slush.role',
    imageBase: '/wf/6462320c9437b6eebb804763_Slush',
    twitter: 'https://twitter.com/slush',
    linkedin: 'https://www.linkedin.com/in/marekpalatinus/',
  },
  {
    nameKey: 'board.viliam.name',
    roleKey: 'board.viliam.role',
    imageBase: '/wf/viliam-klamarcik',
    twitter: 'https://x.com/ViliamKlamarcik',
    linkedin: 'https://www.linkedin.com/in/viliamklamarcik/',
  },
] satisfies ReadonlyArray<{
  readonly nameKey: CopyKey<'home'>
  readonly roleKey: CopyKey<'home'>
  readonly imageBase: string
  readonly twitter: string
  readonly linkedin: string
}>

export function Board({t}: {readonly t: PageCopy<'home'>}): React.JSX.Element {
  return (
    <div className="board">
      <div className="h-p ver w-row">
        <div className="header w-col w-col-6">
          <h2 className="h2">{t('board.headline')}</h2>
        </div>
        <div className="paragraph w-col w-col-6">
          <p className="p white">{t('board.text')}</p>
        </div>
      </div>
      <div className="team">
        {Array.map(members, (member) => (
          <div key={member.nameKey} className="punk">
            <img
              src={`${member.imageBase}.png`}
              loading="lazy"
              sizes="(max-width: 767px) 100vw, 768px"
              srcSet={`${member.imageBase}-p-500.png 500w, ${member.imageBase}.png 768w`}
              alt=""
              className="image-3"
            />
            <div className="punkcontent">
              <div className="name-socials">
                <p className="p2">{t(member.nameKey)}</p>
                <div className="socials">
                  <a
                    href={member.twitter}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${t.text(member.nameKey)} on X`}
                    className="soclink w-inline-block"
                  >
                    <img
                      src="/wf/646232e59ea4e07b627bb058_Lil_TW.svg"
                      loading="lazy"
                      alt=""
                      className="tw"
                    />
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${t.text(member.nameKey)} on LinkedIn`}
                    className="soclink w-inline-block"
                  >
                    <img
                      src="/wf/646232e5913be65f885516da_Lil_LI.svg"
                      loading="lazy"
                      alt=""
                      className="li"
                    />
                  </a>
                </div>
              </div>
              <p className="p2 gray">{t(member.roleKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
