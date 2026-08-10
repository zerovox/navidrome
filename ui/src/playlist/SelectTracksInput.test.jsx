import * as React from 'react'
import { TestContext } from 'ra-test'
import { DataProviderContext } from 'react-admin'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SelectTracksInput } from './SelectTracksInput'

const mockSongs = [
  {
    id: 'song-1',
    title: 'Comfortably Numb',
    artist: 'Pink Floyd',
    album: 'The Wall',
    missing: false,
  },
  {
    id: 'song-2',
    title: 'Hey You',
    artist: 'Pink Floyd',
    album: 'The Wall',
    missing: true,
  },
]

const createTestComponent = ({
  onChange = vi.fn(),
  data = mockSongs,
  total = data.length,
  getList,
} = {}) => {
  const dataProvider = {
    getList: getList || vi.fn().mockResolvedValue({ data, total }),
  }

  render(
    <DataProviderContext.Provider value={dataProvider}>
      <TestContext>
        <SelectTracksInput onChange={onChange} />
      </TestContext>
    </DataProviderContext.Provider>,
  )

  return { dataProvider, onChange }
}

const search = (text) =>
  fireEvent.change(screen.getByRole('textbox'), { target: { value: text } })

describe('SelectTracksInput', () => {
  afterEach(cleanup)

  it('does not query anything until the user types', async () => {
    const { dataProvider } = createTestComponent()

    expect(
      screen.getByText('resources.playlist.message.searchForTracks'),
    ).toBeInTheDocument()
    expect(dataProvider.getList).not.toHaveBeenCalled()
  })

  it('searches songs by the typed text and shows track, artist and album', async () => {
    const { dataProvider } = createTestComponent()

    search('wall')

    await waitFor(() => {
      expect(dataProvider.getList).toHaveBeenCalledWith('song', {
        pagination: { page: 1, perPage: 50 },
        sort: { field: 'title', order: 'ASC' },
        filter: { title: 'wall' },
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Comfortably Numb')).toBeInTheDocument()
    })
    expect(screen.getAllByText('Pink Floyd • The Wall')).toHaveLength(2)
  })

  it('debounces the search while the user is still typing', async () => {
    const { dataProvider } = createTestComponent()

    search('p')
    search('pi')
    search('pink')

    await waitFor(() => {
      expect(dataProvider.getList).toHaveBeenCalledTimes(1)
    })
    expect(dataProvider.getList).toHaveBeenCalledWith(
      'song',
      expect.objectContaining({ filter: { title: 'pink' } }),
    )
  })

  it('flags missing tracks', async () => {
    createTestComponent()

    search('wall')

    await waitFor(() => {
      expect(screen.getByText('Hey You')).toBeInTheDocument()
    })
    // Only the missing song is tagged
    expect(screen.getAllByText('resources.song.fields.missing')).toHaveLength(1)
  })

  it('selects and deselects tracks, reporting the selection', async () => {
    const { onChange } = createTestComponent()

    search('wall')

    await waitFor(() => {
      expect(screen.getByText('Comfortably Numb')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Comfortably Numb'))
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith([mockSongs[0]])
    })
    // Shown both in the list and as a selected chip
    expect(screen.getAllByText('Comfortably Numb')).toHaveLength(2)

    fireEvent.click(screen.getAllByText('Comfortably Numb')[0])
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith([])
    })
  })

  it('removes a selected track via its chip', async () => {
    const { onChange } = createTestComponent()

    search('wall')

    await waitFor(() => {
      expect(screen.getByText('Comfortably Numb')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Comfortably Numb'))
    await waitFor(() => {
      expect(screen.getAllByText('Comfortably Numb')).toHaveLength(2)
    })

    fireEvent.click(screen.getByText('×'))

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith([])
    })
    expect(screen.getAllByText('Comfortably Numb')).toHaveLength(1)
  })

  it('keeps selected tracks when the search changes', async () => {
    const getList = vi
      .fn()
      .mockResolvedValueOnce({ data: mockSongs, total: mockSongs.length })
      .mockResolvedValueOnce({ data: [], total: 0 })
    createTestComponent({ getList })

    search('wall')
    await waitFor(() => {
      expect(screen.getByText('Comfortably Numb')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Comfortably Numb'))

    search('something else')
    await waitFor(() => {
      expect(
        screen.getByText('resources.playlist.message.noTracksFound'),
      ).toBeInTheDocument()
    })
    // Still listed as a selected chip
    expect(screen.getByText('Comfortably Numb')).toBeInTheDocument()
  })

  it('shows a hint when there are more matches than can be listed', async () => {
    createTestComponent({ total: 500 })

    search('wall')

    await waitFor(() => {
      expect(
        screen.getByText('resources.playlist.message.tooManyTracks'),
      ).toBeInTheDocument()
    })
  })

  it('notifies and shows no results when the search fails', async () => {
    const getList = vi.fn().mockRejectedValue(new Error('boom'))
    createTestComponent({ getList })

    search('wall')

    await waitFor(() => {
      expect(
        screen.getByText('resources.playlist.message.noTracksFound'),
      ).toBeInTheDocument()
    })
  })
})
