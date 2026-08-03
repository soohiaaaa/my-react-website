import { useState, useEffect } from 'react'

function App() {
  const [reportData, setReportData] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [chatHistory, setChatHistory] = useState([
    { sender: 'bot', text: '欢迎使用零售智能分析平台！我已经成功连接您的 Kaggle 数仓 (DuckDB)。' }
  ])
  const [errorMsg, setErrorMsg] = useState(null)

  // 1. 页面加载时，自动呼叫后端的真实 Kaggle SQL 聚合报表数据
  useEffect(() => {
    fetch("http://localhost:8000/analytics/top-products-share")
      .then(res => {
        if (!res.ok) throw new Error("无法读取数仓分析数据，请确保后端服务在 8000 端口运行。")
        return res.json()
      })
      .then(res => {
        if (res.status === "success") {
          setReportData(res.data)
        }
      })
      .catch(err => setErrorMsg(err.message))
  }, [])

  // 2. 发送消息给后端的 Chatbot 路由
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return
    const userMessage = { sender: 'user', text: chatInput }
    setChatHistory(prev => [...prev, userMessage])
    const currentInput = chatInput
    setChatInput("")

    try {
      const res = await fetch("http://localhost:8000/chatbot/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput })
      })
      const data = await res.json()
      setChatHistory(prev => [...prev, { sender: 'bot', text: data.reply }])
    } catch {
      setChatHistory(prev => [...prev, { sender: 'bot', text: "❌ 无法连接到后端 Chatbot 路由，请检查后端。" }])
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'system-ui, sans-serif', margin: 0, backgroundColor: '#f4f6f9', boxSizing: 'border-box' }}>
      
      {/* 左侧：数仓高级 SQL 统计报表 */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <h1 style={{ color: '#1e293b', marginBottom: '5px', fontSize: '28px' }}>📈 零售智能运营与数仓分析平台</h1>
        <p style={{ color: '#64748b', marginTop: 0 }}>数据底座：Kaggle 真实零售数据集 + DuckDB 高速分析引擎</p>
  
        {errorMsg ? (
          <div style={{ color: '#b91c1c', background: '#fee2e2', padding: '15px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
            <strong>核心断点：</strong> {errorMsg}
          </div>
        ) : (
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#334155', marginTop: 0, marginBottom: '20px' }}>
              📊 畅销商品分类销量占比 (后端高级 SQL 窗口函数实时计算)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px' }}>商品名称 (product_name)</th>
                  <th style={{ padding: '12px' }}>所属品类 (category)</th>
                  <th style={{ padding: '12px' }}>总销量 (total_sales)</th>
                  <th style={{ padding: '12px' }}>全店销量占比</th>
                  <th style={{ padding: '12px' }}>品类内名次</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                      ⏳ 数仓正在计算或表为空，请确保后端活跃行数大于 0。
                    </td>
                  </tr>
                ) : (
                  reportData.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#0f172a' }}>{row.product_name}</td>
                      <td style={{ padding: '12px', color: '#475569' }}>{row.category}</td>
                      <td style={{ padding: '12px', color: '#10b981', fontWeight: '600' }}>{row.total_sales}</td>
                      <td style={{ padding: '12px', color: '#3b82f6', fontWeight: '600' }}>{row.sales_percentage_share}%</td>
                      <td style={{ padding: '12px' }}>🥇 品类第 {row.rank_in_category} 名</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
  
      {/* 右侧：交互式 Chatbot 侧边栏 */}
      <div style={{ width: '380px', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', boxShadow: '-4px 0 10px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '20px', background: '#0f172a', color: '#fff' }}>
          <h3 style={{ margin: 0 }}>🤖 Intel-Bot 智能运营副官</h3>
          <small style={{ color: '#94a3b8' }}>输入含有 'revenue' 或 'stock' 的话测试逻辑触发</small>
        </div>
  
        {/* 聊天消息流 */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc' }}>
          {chatHistory.map((msg, idx) => (
            <div key={idx} style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              background: msg.sender === 'user' ? '#3b82f6' : '#fff',
              color: msg.sender === 'user' ? '#fff' : '#1e293b',
              padding: '10px 14px',
              borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
              maxWidth: '80%',
              fontSize: '14px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              {msg.text}
            </div>
          ))}
        </div>
  
        {/* 聊天输入框 */}
        <div style={{ padding: '15px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', backgroundColor: '#fff' }}>
          <input 
            style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="问我关于营收或库存的事..."
            onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
          />
          <button 
            style={{ padding: '10px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }} 
            onClick={sendChatMessage}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
  
}

export default App
