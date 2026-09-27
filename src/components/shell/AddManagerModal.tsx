import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/store'
import { ManagerAvatarUploader } from '../onboarding/ManagerAvatarUploader'
import { AvatarTemplatePicker } from '../ui/Identity'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

/**
 * Compact "+ Add Manager" experience: avatar upload or a gradient PFP
 * template, fixed "The Manager" title, optional nickname, Create Manager.
 * Creates only the Manager identity — never a project. After creation the
 * new Manager is selected and its (empty) project section is shown.
 */
export const AddManagerModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const navigate = useNavigate()
  const createManager = useStore((s) => s.createManager)
  const setManagerViewMode = useStore((s) => s.setManagerViewMode)
  const [avatar, setAvatar] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [nickname, setNickname] = useState('')

  const close = () => {
    setAvatar('')
    setTemplateId('')
    setNickname('')
    onClose()
  }

  const create = () => {
    createManager({ nickname, avatar, templateId })
    setManagerViewMode('projects')
    close()
    navigate('/home')
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add Manager"
      description="A Manager owns its own projects and conversations."
      width="max-w-sm"
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button onClick={create}>Create Manager</Button>
        </>
      }
    >
      <div className="flex flex-col items-center">
        <ManagerAvatarUploader value={avatar} onChange={setAvatar} />
        <AvatarTemplatePicker className="mt-4" value={templateId} onChange={setTemplateId} />
        <p className="mt-4 text-[16px] font-semibold text-paper">The Manager</p>
        {nickname.trim() && (
          <p className="mt-0.5 text-[13px] text-muted">{nickname.trim()}</p>
        )}
        <div className="mt-5 w-full text-left">
          <label
            htmlFor="new-manager-nickname"
            className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted"
          >
            Nickname <span className="normal-case tracking-normal opacity-70">(optional)</span>
          </label>
          <input
            id="new-manager-nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. Atlas"
            maxLength={24}
            className="h-11 w-full rounded-[8px] border border-line bg-input px-4 text-[14px] text-paper placeholder:text-faint focus:outline-none"
          />
        </div>
      </div>
    </Modal>
  )
}
