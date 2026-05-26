import React from 'react';
import { Avatar } from '../Common/Avatar';

export const FriendsList = ({ friends, onOpenProfile }) => {
  return (
    <div className="p-3">
      <h6>Мои друзья:</h6>
      {friends.map(f => (
        <div
          key={f._id}
          onClick={() => onOpenProfile(f)}
          className="cursor-pointer p-2 list-item-hover d-flex align-items-center"
        >
          <Avatar user={f} size={38} showBadge={true} />
          <div className="ms-2">
            <div className="fw-bold">{f.displayName || f.username}</div>
            <div className="small text-muted">@{f.username}</div>
          </div>
        </div>
      ))}
      {friends.length === 0 && (
        <p className="text-muted text-center">У вас пока нет друзей</p>
      )}
    </div>
  );
};