# 🔧 修复 Binary File 错误

## 问题原因

n8n Webhook 接收到的文件存储在 binary data 中,字段名通常是 `data`,但你的 "Upload Image to Server" 节点在寻找 `photo.jpg`。

## ✅ 解决方案

### 步骤 1: 修改 "Upload Image to Server" 节点

打开这个节点,找到 Binary File 部分:

**当前配置(错误):**
```
Parameter Type: n8n Binary File
Name: file
Input Data Field Name: {{ $json.fileName }}  ← 这个是错的!
```

**正确配置:**
```
Parameter Type: n8n Binary File  
Name: file
Input Data Field Name: data  ← 改成这个!
```

### 步骤 2: 详细修改指南

1. **点击 "Upload Image to Server" 节点**

2. **滚动到 Body Parameters 部分**

3. **找到最后一个参数(Binary File)**
   - Parameter Type: `n8n Binary File`
   - Name: `file`
   - Input Data Field Name: 改为 `data`

4. **点击右上角的 "Execute node" 测试**

5. **保存并激活 workflow**

### 步骤 3: 如果还是找不到文件

可能 Webhook 的二进制字段名不是 `data`,让我们先检查一下。

#### 添加调试节点:

**在 Webhook 和 Upload 之间添加一个 Code 节点:**

```javascript
// 查看 Webhook 接收到了什么
console.log('Binary data keys:', Object.keys($binary));
console.log('JSON data:', $json);

// 返回所有数据
return items;
```

#### 然后测试上传,查看日志:

1. 上传一张图片
2. 在 n8n Executions 中打开这次执行
3. 点击 Code 节点
4. 查看输出,会显示:
   ```
   Binary data keys: ['data']  或 ['file'] 或其他
   ```
5. 用这个名字替换 Input Data Field Name

## 📝 完整的正确配置

### Upload Image to Server 节点:

```json
{
  "Body Content Type": "Form-Data",
  "Body Parameters": [
    {
      "Parameter Type": "Form Data",
      "Name": "uploadPath",
      "Value": "images/user-uploads"
    },
    {
      "Parameter Type": "Form Data",
      "Name": "fileName",
      "Value": "={{ Date.now() + '_' + $('Save Request Info').item.json.fileName }}"
    },
    {
      "Parameter Type": "n8n Binary File",
      "Name": "file",
      "Input Data Field Name": "data"  ← 关键!
    }
  ]
}
```

## 🎯 前端代码也要检查

确保你的前端发送的字段名是 `data`:

### ✅ 正确的前端代码:

```javascript
const formData = new FormData();
formData.append('data', file);  // ← 必须是 'data'
formData.append('fileName', file.name);
formData.append('userId', 'test-user');

fetch(webhookUrl, {
    method: 'POST',
    body: formData
});
```

### ❌ 错误的示例:

```javascript
formData.append('file', file);      // ❌ 不要用 'file'
formData.append('photo', file);     // ❌ 不要用 'photo'
formData.append('image', file);     // ❌ 不要用 'image'
```

## 🔍 测试验证

### 方法 1: 使用 curl 测试

```bash
curl -X POST "你的webhook-url" \
  -F "data=@/path/to/photo.jpg" \
  -F "fileName=test.jpg" \
  -F "userId=test-user"
```

### 方法 2: 使用浏览器测试

```html
<!DOCTYPE html>
<html>
<body>
    <input type="file" id="fileInput" accept="image/*">
    <button onclick="testUpload()">测试</button>
    
    <script>
    async function testUpload() {
        const file = document.getElementById('fileInput').files[0];
        
        const formData = new FormData();
        formData.append('data', file);  // ← 使用 'data'
        formData.append('fileName', file.name);
        formData.append('userId', 'test-123');
        
        console.log('FormData entries:');
        for (let pair of formData.entries()) {
            console.log(pair[0] + ':', pair[1]);
        }
        
        const response = await fetch('你的webhook-url', {
            method: 'POST',
            body: formData
        });
        
        const text = await response.text();
        console.log('Response:', text);
    }
    </script>
</body>
</html>
```

## 🚨 常见错误和解决方案

### 错误 1: "but none was found [item 0]"

**原因:** 字段名不匹配

**解决:** 
- 检查前端用的是 `formData.append('data', file)`
- 检查 n8n 用的是 `Input Data Field Name: data`

### 错误 2: "Received empty response"

**原因:** Workflow 执行失败,没有返回响应

**解决:**
- 确保 "Respond - Processing Started" 节点被执行
- 检查它是否连接到 Webhook 节点

### 错误 3: "Unexpected end of JSON input"

**原因:** 响应不是有效的 JSON

**解决:**
- 检查 Respond 节点的配置
- 确保返回的是有效 JSON

## ✅ 成功的标志

修复后,你应该看到:

**在 n8n Executions:**
- ✅ Webhook 节点: 有 binary data
- ✅ Upload Image to Server 节点: 成功(绿色)
- ✅ Edit Image 节点: 成功(绿色)

**在浏览器:**
```javascript
Response: {"success":true,"status":"processing",...}
```

**不应该看到:**
```
❌ expects binary file 'photo.jpg'
❌ Received empty response
❌ Error in node
```
