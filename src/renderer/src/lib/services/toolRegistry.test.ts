import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./toolHandlers', () => ({
  handleWriteFile: vi.fn(),
  handleActionSuggestions: vi.fn()
}))

import { createTools } from './toolRegistry'
import { handleWriteFile } from './toolHandlers'

describe('toolRegistry', () => {
  const dispatch = vi.fn() as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows multiple writeFile calls in the same turn', async () => {
    const tools = createTools({
      dispatch,
      activeProject: null
    })

    await tools.writeFile.execute({ file_name: 'Outline', content: 'outline' })
    await tools.writeFile.execute({ file_name: 'abc123', content: '# <!-- id: abc123 --> Chapter 1' })

    expect(handleWriteFile).toHaveBeenCalledTimes(2)
  })

  it('rejects writeFile after readFile in the same turn', async () => {
    const tools = createTools({
      dispatch,
      activeProject: null
    })

    await tools.readFile.execute({ file_names: 'Outline, Chapter 1' })

    await expect(
      tools.writeFile.execute({ file_name: 'Outline', content: 'updated outline' })
    ).rejects.toThrow('writeFile cannot be used in the same turn after readFile')
  })

  it('rejects readFile after writeFile in the same turn', async () => {
    const tools = createTools({
      dispatch,
      activeProject: null
    })

    await tools.writeFile.execute({ file_name: 'Outline', content: 'updated outline' })

    await expect(
      tools.readFile.execute({ file_names: 'Outline, Chapter 1' })
    ).rejects.toThrow('readFile cannot be used in the same turn after writeFile')
  })
})
