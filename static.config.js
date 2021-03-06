import React, {Component} from 'react'
import {extractCritical} from 'emotion-server'

import majors from './src/core/majors'
import questions from './src/core/questions'
import webpack from './webpack.config.js'

const siteRoot = 'https://registration.jwc.in.th'

class Document extends Component {
  render() {
    const {Html, Head, Body, children, renderMeta} = this.props

    return (
      <Html>
        <Head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>สมัครเข้าค่าย Junior Webmaster Camp X</title>

          <meta
            name="description"
            content="พบกันเร็ว ๆ นี้ กับค่าย Junior Webmaster Camp ค่ายทำเว็บของเด็ก ม.ปลาย ปีที่ 10"
          />

          <meta property="og:url" content="https://registration.jwc.in.th" />

          <meta
            property="og:title"
            content="สมัครเข้าค่าย Junior Webmaster Camp X"
          />

          <meta
            property="og:description"
            content="พบกันเร็ว ๆ นี้ กับค่าย Junior Webmaster Camp ค่ายทำเว็บของเด็ก ม.ปลาย ปีที่ 10"
          />

          <meta
            property="og:image"
            content="http://www.jwc.in.th/assets/img/og.jpg"
          />

          <meta
            property="article:author"
            content="https://www.facebook.com/jwcth"
          />

          <style dangerouslySetInnerHTML={{__html: renderMeta.css}} />

          <link
            href="https://fonts.googleapis.com/css?family=Kanit:300,400"
            rel="stylesheet"
          />
        </Head>
        <Body>{children}</Body>
      </Html>
    )
  }
}

const majorRoutes = majors.map(major => ({
  path: '/' + major,
  component: 'src/routes/major',
}))

const steps = [1, 2, 3]

const formRoutes = majors
  .map(major =>
    steps.map(step => ({
      path: '/' + major + '/step' + step,
      component: 'src/routes/step' + step,
    })),
  )
  .reduce((prev, cur) => [...prev, ...cur])

const verifyRoutes = majors.map(major => ({
  path: '/' + major + '/verify',
  component: 'src/routes/verify',
}))

const majorQuestionRoutes = majors.map(major => ({
  path: '/' + major + '/step4',
  component: 'src/routes/step4',
  getData: () => ({questions: questions[major]}),
}))

export default {
  webpack,
  siteRoot,
  getSiteProps: () => ({
    siteRoot,
  }),
  getRoutes: async () => [
    {
      path: '/',
      component: 'src/routes/index',
    },
    ...majorRoutes,
    ...formRoutes,
    ...verifyRoutes,
    ...majorQuestionRoutes,
    {
      path: '/thankyou',
      component: 'src/routes/thankyou',
    },
    {
      path: '/change_denied',
      component: 'src/routes/change_denied',
    },
    {
      is404: true,
      component: 'src/routes/404',
    },
  ],
  renderToHtml: (render, Comp, meta) => {
    const html = render(<Comp />)
    meta.css = extractCritical(html).css
    return html
  },
  Document,
}
