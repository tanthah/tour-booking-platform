import { useState, useEffect, useRef } from 'react';
import { MapPin, Search } from 'lucide-react';

const PHOTON_API_URL = 'https://photon.komoot.io/api/';
const DEBOUNCE_MS = 400;

function formatPhotonFeature(feature) {
  const coords = feature?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;

  const [lng, lat] = coords;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const props = feature.properties || {};
  const streetLine =
    props.housenumber && props.street
      ? `${props.housenumber} ${props.street}`
      : props.street;

  const rawParts = [
    props.name,
    streetLine,
    props.district,
    props.locality,
    props.city || props.town || props.village,
    props.county,
    props.state,
    props.country,
  ];

  // Loại bỏ giá trị rỗng và trùng lặp (không phân biệt hoa thường)
  const seen = new Set();
  const uniqueParts = [];
  for (const part of rawParts) {
    if (!part || typeof part !== 'string') continue;
    const trimmed = part.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueParts.push(trimmed);
    }
  }

  const fullAddress = uniqueParts.join(', ');
  const primaryName = props.name || streetLine || uniqueParts[0] || fullAddress;
  const subtitle = uniqueParts
    .filter((p) => p.toLowerCase() !== primaryName.toLowerCase())
    .join(', ');

  return {
    id: `${props.osm_type || 'p'}_${props.osm_id || `${lat}_${lng}`}_${uniqueParts.length}`,
    name: primaryName,
    address: fullAddress || primaryName,
    subtitle,
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
}

function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Nhập tên địa điểm hoặc địa chỉ (VD: Bà Nà Hills)...',
  disabled = false,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const skipNextSearchRef = useRef(false);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce 400ms trước khi gọi Photon API
  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    const query = (value || '').trim();
    if (query.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setFetchError('');
        const params = new URLSearchParams({
          q: query,
          limit: '5',
          lang: 'default',
          lat: '16',
          lon: '108',
        });
        const res = await fetch(`${PHOTON_API_URL}?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        const features = Array.isArray(data?.features) ? data.features : [];
        const mapped = features.map(formatPhotonFeature).filter(Boolean);

        setSuggestions(mapped);
        setSearched(true);
        setActiveIndex(-1);
        setIsOpen(true);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setSuggestions([]);
        setSearched(true);
        setFetchError('Không thể tìm kiếm địa chỉ lúc này. Bạn vẫn có thể nhập tay hoặc chọn trên bản đồ.');
        setIsOpen(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  const handleSelectItem = (item) => {
    skipNextSearchRef.current = true;
    setIsOpen(false);
    setSuggestions([]);
    setSearched(false);
    setActiveIndex(-1);
    if (onSelect) {
      onSelect({
        name: item.name,
        address: item.address,
        lat: item.lat,
        lng: item.lng,
      });
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      handleSelectItem(suggestions[activeIndex]);
    }
  };

  const handleInputChange = (e) => {
    const nextValue = e.target.value;
    if (nextValue.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setSearched(false);
      setFetchError('');
      setLoading(false);
    }
    onChange(nextValue);
  };

  return (
    <div ref={containerRef} className="position-relative">
      <div className="position-relative">
        <Search
          size={14}
          className="text-muted position-absolute"
          style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        />
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ paddingLeft: '30px', paddingRight: '30px' }}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if ((value || '').trim().length >= 2 && suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
        {loading && (
          <span
            className="spinner-border spinner-border-sm text-primary position-absolute"
            role="status"
            aria-hidden="true"
            style={{
              right: '10px',
              top: '50%',
              marginTop: '-7px',
              width: '14px',
              height: '14px',
            }}
          />
        )}
      </div>

      {isOpen && (value || '').trim().length >= 2 && (
        <div
          className="position-absolute w-100 bg-white border rounded-3 shadow mt-1"
          style={{ zIndex: 1060, maxHeight: '230px', overflowY: 'auto' }}
        >
          {fetchError ? (
            <div className="px-3 py-2 text-danger small">{fetchError}</div>
          ) : suggestions.length > 0 ? (
            suggestions.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`w-100 text-start border-0 px-3 py-2 d-flex align-items-start gap-2 ${
                  index === activeIndex ? 'bg-light' : 'bg-white'
                }`}
                style={{
                  borderBottom: index < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => handleSelectItem(item)}
              >
                <MapPin size={15} className="text-warning flex-shrink-0 mt-1" />
                <div className="overflow-hidden">
                  <div className="fw-semibold text-dark text-truncate" style={{ fontSize: '13px' }}>
                    {item.name}
                  </div>
                  {item.subtitle && (
                    <div className="text-muted text-truncate" style={{ fontSize: '11.5px' }}>
                      {item.subtitle}
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : (
            searched && (
              <div className="px-3 py-2 text-muted small">Không tìm thấy kết quả phù hợp.</div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default AddressAutocomplete;
