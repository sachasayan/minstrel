
const ChatLoadingIndicator = () => {
  return (
    <>
      <div className="flex items-center justify-center p-2">
        <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1"></div>
        <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1 delay-75"></div>
        <div className="animate-ping h-2 w-2 bg-gray-400 rounded-full mx-1 delay-150"></div>
      </div>
    </>
  )
}

export default ChatLoadingIndicator
