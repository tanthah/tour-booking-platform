import { useState } from 'react';
import { Card, Button, Form, Badge, ButtonGroup } from 'react-bootstrap';
import {
  Type,
  Heading,
  Image as ImageIcon,
  Quote as QuoteIcon,
  List,
  Minus,
  ArrowUp,
  ArrowDown,
  Trash2,
} from 'lucide-react';
import articleService from '../articleService';

const generateId = () => `b_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

function ArticleEditor({ blocks = [], onChange }) {
  const [uploadingBlockId, setUploadingBlockId] = useState(null);

  const addBlock = (type) => {
    let newBlock = { id: generateId(), type, data: {} };
    if (type === 'header') newBlock.data = { text: '', level: 2 };
    else if (type === 'paragraph') newBlock.data = { text: '' };
    else if (type === 'image') newBlock.data = { file: { url: '' }, caption: '', alt: '' };
    else if (type === 'quote') newBlock.data = { text: '', caption: '' };
    else if (type === 'list') newBlock.data = { style: 'unordered', items: [''] };
    else if (type === 'delimiter') newBlock.data = {};

    onChange([...blocks, newBlock]);
  };

  const updateBlock = (index, updatedData) => {
    const nextBlocks = [...blocks];
    nextBlocks[index] = {
      ...nextBlocks[index],
      data: { ...nextBlocks[index].data, ...updatedData },
    };
    onChange(nextBlocks);
  };

  const removeBlock = (index) => {
    const nextBlocks = blocks.filter((_, i) => i !== index);
    onChange(nextBlocks);
  };

  const moveBlock = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const nextBlocks = [...blocks];
    const [moved] = nextBlocks.splice(index, 1);
    nextBlocks.splice(targetIndex, 0, moved);
    onChange(nextBlocks);
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;
    const blockId = blocks[index].id;
    try {
      setUploadingBlockId(blockId);
      const res = await articleService.uploadImage(file);
      const url = res.data?.url || res.url;
      updateBlock(index, {
        file: { url, public_id: res.data?.public_id || '' },
        alt: file.name.replace(/\.[^/.]+$/, ''),
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Upload ảnh thất bại');
    } finally {
      setUploadingBlockId(null);
    }
  };

  return (
    <div className="article-editor">
      {blocks.length === 0 ? (
        <div className="text-center py-5 border border-dashed rounded bg-light mb-3">
          <p className="text-muted mb-2">Chưa có khối nội dung nào</p>
          <small className="text-muted">Chọn loại nội dung bên dưới để bắt đầu soạn thảo</small>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3 mb-3">
          {blocks.map((block, index) => (
            <Card key={block.id || index} className="shadow-sm border">
              <Card.Header className="py-1 px-3 d-flex justify-content-between align-items-center bg-white border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <Badge bg="secondary" className="text-uppercase fw-normal" style={{ fontSize: '11px' }}>
                    {block.type === 'header' && `Tiêu đề H${block.data.level || 2}`}
                    {block.type === 'paragraph' && 'Đoạn văn'}
                    {block.type === 'image' && 'Hình ảnh'}
                    {block.type === 'quote' && 'Trích dẫn'}
                    {block.type === 'list' && 'Danh sách'}
                    {block.type === 'delimiter' && 'Đường phân cách'}
                  </Badge>
                  <small className="text-muted">#{index + 1}</small>
                </div>
                <ButtonGroup size="sm">
                  <Button
                    variant="outline-secondary"
                    className="p-1"
                    disabled={index === 0}
                    onClick={() => moveBlock(index, -1)}
                    title="Di chuyển lên"
                  >
                    <ArrowUp size={14} />
                  </Button>
                  <Button
                    variant="outline-secondary"
                    className="p-1"
                    disabled={index === blocks.length - 1}
                    onClick={() => moveBlock(index, 1)}
                    title="Di chuyển xuống"
                  >
                    <ArrowDown size={14} />
                  </Button>
                  <Button
                    variant="outline-danger"
                    className="p-1"
                    onClick={() => removeBlock(index)}
                    title="Xóa khối"
                  >
                    <Trash2 size={14} />
                  </Button>
                </ButtonGroup>
              </Card.Header>
              <Card.Body className="p-3">
                {block.type === 'header' && (
                  <div>
                    <div className="d-flex gap-2 mb-2">
                      <Button
                        size="sm"
                        variant={block.data.level === 2 ? 'primary' : 'outline-secondary'}
                        onClick={() => updateBlock(index, { level: 2 })}
                      >
                        H2
                      </Button>
                      <Button
                        size="sm"
                        variant={block.data.level === 3 ? 'primary' : 'outline-secondary'}
                        onClick={() => updateBlock(index, { level: 3 })}
                      >
                        H3
                      </Button>
                    </div>
                    <Form.Control
                      type="text"
                      placeholder="Nhập tiêu đề mục..."
                      className="fw-bold"
                      value={block.data.text || ''}
                      onChange={(e) => updateBlock(index, { text: e.target.value })}
                    />
                  </div>
                )}

                {block.type === 'paragraph' && (
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Nhập nội dung đoạn văn..."
                    value={block.data.text || ''}
                    onChange={(e) => updateBlock(index, { text: e.target.value })}
                  />
                )}

                {block.type === 'image' && (
                  <div>
                    {block.data.file?.url ? (
                      <div className="mb-2 text-center position-relative">
                        <img
                          src={block.data.file.url}
                          alt={block.data.alt || 'Hình ảnh bài viết'}
                          className="img-fluid rounded border"
                          style={{ maxHeight: '280px', objectFit: 'cover' }}
                        />
                      </div>
                    ) : null}
                    <div className="d-flex gap-2 mb-2 align-items-center">
                      <Form.Control
                        type="file"
                        accept="image/*"
                        disabled={uploadingBlockId === block.id}
                        onChange={(e) => handleImageUpload(index, e.target.files[0])}
                      />
                      {uploadingBlockId === block.id && (
                        <small className="text-primary text-nowrap">Đang tải lên...</small>
                      )}
                    </div>
                    <Form.Control
                      size="sm"
                      type="text"
                      placeholder="Ghi chú ảnh (Caption)..."
                      className="mb-1"
                      value={block.data.caption || ''}
                      onChange={(e) => updateBlock(index, { caption: e.target.value })}
                    />
                    <Form.Control
                      size="sm"
                      type="text"
                      placeholder="Mô tả thay thế (Alt text)..."
                      value={block.data.alt || ''}
                      onChange={(e) => updateBlock(index, { alt: e.target.value })}
                    />
                  </div>
                )}

                {block.type === 'quote' && (
                  <div>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Nhập câu trích dẫn nổi bật..."
                      className="fst-italic mb-2"
                      value={block.data.text || ''}
                      onChange={(e) => updateBlock(index, { text: e.target.value })}
                    />
                    <Form.Control
                      size="sm"
                      type="text"
                      placeholder="Tác giả hoặc nguồn trích dẫn..."
                      value={block.data.caption || ''}
                      onChange={(e) => updateBlock(index, { caption: e.target.value })}
                    />
                  </div>
                )}

                {block.type === 'list' && (
                  <div>
                    {(block.data.items || []).map((item, itemIdx) => (
                      <div key={itemIdx} className="d-flex gap-2 mb-2 align-items-center">
                        <span className="text-muted">•</span>
                        <Form.Control
                          size="sm"
                          type="text"
                          value={item}
                          placeholder={`Mục ${itemIdx + 1}`}
                          onChange={(e) => {
                            const newItems = [...(block.data.items || [])];
                            newItems[itemIdx] = e.target.value;
                            updateBlock(index, { items: newItems });
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline-danger"
                          className="p-1"
                          onClick={() => {
                            const newItems = (block.data.items || []).filter((_, i) => i !== itemIdx);
                            updateBlock(index, { items: newItems });
                          }}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => {
                        const newItems = [...(block.data.items || []), ''];
                        updateBlock(index, { items: newItems });
                      }}
                    >
                      + Thêm dòng
                    </Button>
                  </div>
                )}

                {block.type === 'delimiter' && (
                  <div className="text-center text-muted py-2">
                    <hr className="my-1" />
                    <small>--- Đường phân cách khối ---</small>
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Toolbar thêm khối */}
      <div className="d-flex flex-wrap gap-2 p-2 bg-light border rounded align-items-center">
        <span className="text-muted small fw-bold me-1">Thêm khối:</span>
        <Button size="sm" variant="outline-dark" onClick={() => addBlock('paragraph')}>
          <Type size={14} className="me-1" /> Đoạn văn
        </Button>
        <Button size="sm" variant="outline-dark" onClick={() => addBlock('header')}>
          <Heading size={14} className="me-1" /> Tiêu đề
        </Button>
        <Button size="sm" variant="outline-dark" onClick={() => addBlock('image')}>
          <ImageIcon size={14} className="me-1" /> Hình ảnh
        </Button>
        <Button size="sm" variant="outline-dark" onClick={() => addBlock('quote')}>
          <QuoteIcon size={14} className="me-1" /> Trích dẫn
        </Button>
        <Button size="sm" variant="outline-dark" onClick={() => addBlock('list')}>
          <List size={14} className="me-1" /> Danh sách
        </Button>
        <Button size="sm" variant="outline-dark" onClick={() => addBlock('delimiter')}>
          <Minus size={14} className="me-1" /> Phân cách
        </Button>
      </div>
    </div>
  );
}

export default ArticleEditor;
