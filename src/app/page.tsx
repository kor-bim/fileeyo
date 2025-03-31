'use client'

import { useFunnel } from '@use-funnel/browser'
import { Intro, UploadStep, ShareStep } from '@/shared/types'
import { IntroScreen, UploadScreen, ShareScreen } from './_components'

export default function HomePage() {
  const funnel = useFunnel<{
    Intro: Intro
    UploadScreen: UploadStep
    ShareScreen: ShareStep
  }>({
    id: 'fileeyo-funnel',
    initial: {
      step: 'Intro',
      context: {}
    }
  })

  return (
    <div className="w-full max-w-xl flex flex-col items-center justify-center gap-8 mt-3 px-4">
      <div className="w-full flex flex-col items-center justify-center">
        <span className="sm:text-xl">
          <strong className="text-[#C4441D] font-bold">파일</strong> 좀 보내볼까요?
        </span>
        <span className="sm:text-xl">
          <strong className="text-[#C4441D] font-bold">설치 없이</strong> 브라우저만 있으면 바로 전송할 수 있어요.
        </span>
      </div>
      <funnel.Render
        Intro={({ history }) => <IntroScreen onFileSelect={(ctx) => history.push('UploadScreen', ctx)} />}
        UploadScreen={({ context, history }) => (
          <UploadScreen
            {...context}
            onChange={(ctx) => history.replace('UploadScreen', ctx)}
            onNext={() => history.push('ShareScreen', () => context as ShareStep)}
            onCancel={() => history.push('Intro')}
          />
        )}
        ShareScreen={({ context }) => <ShareScreen {...context} />}
      />
      <span className="text-sm dark:text-[#A8A29E] text-[#57534E]">
        파일을 선택하면 이용약관에 동의하는 걸로 간주돼요 :)
      </span>
    </div>
  )
}
