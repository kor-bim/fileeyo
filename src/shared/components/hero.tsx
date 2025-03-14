import { Icon } from '@iconify/react'

export const Hero = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-5">
      <Icon icon="custom:delivery" width={250} height={250} />
      <Icon icon="custom:fileeyo" width={250} height={76} className="text-[#C4441D]" />
    </div>
  )
}
