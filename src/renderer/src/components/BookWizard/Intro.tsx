import minstrelIcon from '@/assets/bot/base.png'

const Intro = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <img src={minstrelIcon} alt="Assistant" className="size-8 shrink-0 mt-1" />
        <div className="bg-highlight-600 text-highlight-100 p-4 rounded-lg flex-grow">
          <h2 className="text-lg font-semibold mb-1">Hello, Dreamer!</h2>
          <p className="text-sm">A new story! That&apos;s great! Let&apos;s get started.</p>
        </div>
      </div>
    </div>
  )
}

export default Intro
