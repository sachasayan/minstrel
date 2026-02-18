import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import { useOnboarding } from './context'
import minstrelIcon from '@/assets/bot/base.png'

interface OnboardingSecureStorageStepProps {
    isActive: boolean
}

const OnboardingSecureStorageStep = ({ isActive }: OnboardingSecureStorageStepProps): ReactNode => {
    const { setCurrentStep } = useOnboarding()
    const [status, setStatus] = useState<'idle' | 'enabling' | 'enabled' | 'error'>('idle')

    const handleEnable = async () => {
        setStatus('enabling')
        try {
            // @ts-ignore - electron is available via preload
            const success = await window.electron.ipcRenderer.invoke('trigger-safe-storage-prompt')
            if (success) {
                setStatus('enabled')
                // Slight delay for feedback before moving on
                setTimeout(() => setCurrentStep((prev) => prev + 1), 1000)
            } else {
                // Even if it "fails" (user declined or not available),
                // we can still let them proceed, just not encrypted.
                setStatus('error')
            }
        } catch (error) {
            console.error('Failed to trigger safe storage:', error)
            setStatus('error')
        }
    }

    const handleProceed = () => {
        setCurrentStep((prev) => prev + 1)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-3">
                <img src={minstrelIcon} alt="Assistant" className="size-8 shrink-0 mt-1" />
                <div className="bg-highlight-600 text-highlight-100 p-4 rounded-lg flex-grow">
                    <h2 className="text-lg font-semibold mb-1">Secure Your Data</h2>
                    <p className="text-sm mb-4">
                        Minstrel can use your system&apos;s keychain to encrypt sensitive information like API keys.
                        This keeps your credentials safe even if someone gains access to your settings file.
                        <br />
                        <br />
                        When you click enable, your computer might ask for permission to let Minstrel access your
                        keychain.
                    </p>

                    <div className="flex flex-row gap-2 justify-end mt-4">
                        {status === 'error' && (
                            <div className="mr-auto self-center flex flex-col">
                                <p className="text-xs text-red-300 flex items-center gap-1">
                                    <ShieldAlert className="h-3 w-3" /> Encryption not supported or declined.
                                </p>
                                <p className="text-[10px] text-highlight-100/60">Using standard storage instead.</p>
                            </div>
                        )}

                        {status === 'error' ? (
                            <Button variant="secondary" size="sm" onClick={handleProceed} disabled={!isActive}>
                                Proceed Anyway
                            </Button>
                        ) : (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleProceed}
                                disabled={!isActive || status === 'enabling' || status === 'enabled'}
                            >
                                Skip
                            </Button>
                        )}

                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleEnable}
                            disabled={!isActive || status === 'enabling' || status === 'enabled'}
                            className="bg-[#87a9ff] text-[#1a1c1e] hover:bg-[#87a9ff]/90 disabled:opacity-50"
                        >
                            {status === 'enabling' ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enabling...
                                </>
                            ) : status === 'enabled' ? (
                                <>
                                    <ShieldCheck className="mr-2 h-4 w-4" /> Enabled
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="mr-2 h-4 w-4" /> Enable Secure Storage
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OnboardingSecureStorageStep
