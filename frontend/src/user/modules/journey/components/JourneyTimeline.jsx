import StopCard from './StopCard';

function JourneyTimeline({ stops = [], selectedStopId, onSelectStop }) {
  if (!stops.length) {
    return (
      <div className="p-4 text-center text-muted bg-white rounded-4 border">
        Chưa có địa điểm nào trong lịch trình.
      </div>
    );
  }

  return (
    <div className="journey-timeline">
      {stops.map((stop, idx) => (
        <StopCard
          key={stop._id}
          stop={stop}
          index={idx}
          isSelected={selectedStopId === stop._id}
          onSelect={onSelectStop}
        />
      ))}
    </div>
  );
}

export default JourneyTimeline;

