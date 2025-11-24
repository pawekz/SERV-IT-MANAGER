import { useState } from 'react';
import { useRepairPhoto } from '../../../hooks/useRepairPhoto';

function TicketImage({ path, alt, className }) {
  const { data: src, isLoading } = useRepairPhoto(path);
  
  if (isLoading || !src) {
    return <div className={className + ' bg-gray-100 flex items-center justify-center'}>Loading...</div>;
  }
  
  return <img loading="lazy" src={src} alt={alt} className={className} />;
}

const AfterPicturesGallery = ({ photos = [] }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  if (!photos || photos.length === 0) return null;

  const openModal = idx => { setCurrentIdx(idx); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);
  const prev = e => { e.stopPropagation(); setCurrentIdx(p => (p === 0 ? photos.length - 1 : p - 1)); };
  const next = e => { e.stopPropagation(); setCurrentIdx(p => (p === photos.length - 1 ? 0 : p + 1)); };

  return (
    <div className="mb-6 max-w-3xl mx-auto">
      <h3 className="text-md font-semibold mb-2">After Pictures</h3>
      <div className="flex flex-wrap gap-2">
        {photos.map((url, idx) => (
          <div key={idx} className="cursor-pointer" onClick={() => openModal(idx)}>
            <TicketImage path={url} alt={`After repair photo ${idx + 1}`} className="w-24 h-24 object-cover rounded border" />
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="relative max-w-[90vw] max-h-[90vh] bg-black rounded-lg" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-2xl text-white" onClick={closeModal}>&times;</button>
            <div className="relative flex items-center justify-center">
              <TicketImage path={photos[currentIdx]} alt={`After repair photo ${currentIdx + 1}`} className="max-w-[90vw] max-h-[85vh] object-contain" />
              {photos.length > 1 && (
                <> 
                  <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-2xl">&#8592;</button>
                  <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-2xl">&#8594;</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AfterPicturesGallery;
