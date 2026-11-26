import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiBell, FiCheck, FiClock, FiTrash2, FiUserPlus, FiAlertTriangle } from "react-icons/fi";
import { getRoleSession } from "../../services/roleApi";
import {
  clearAllNotifications,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../redux/features/notifications/notificationsSlice";
import { decideSignup, fetchPendingUsers, selectPendingUsers } from "../../redux/features/users/usersSlice";
import "./AdminPages.css";

function notificationTitle(item){return item.title||({signup_approval:"Signup approval request",custom:"Community notification"}[item.type]||String(item.type||"Notification").replaceAll("_"," "));}
export default function AdministratorNotifications(){
  const dispatch = useDispatch();
  const session=getRoleSession("admin");
  const viewer=useMemo(()=>({ role:"admin", id:session.id }),[session.id]);
  // notifications and pending sign-ups both come from the Redux store
  const items = useSelector((state) => state.notifications);
  const pending = useSelector((state) => selectPendingUsers(state, viewer));
  const [filter,setFilter]=useState("all");const [state,setState]=useState({loading:true,busy:"",error:"",success:""});
  const load=useCallback(async()=>{setState((s)=>({...s,loading:true,error:""}));try{await Promise.all([dispatch(fetchNotifications({viewer})).unwrap(),dispatch(fetchPendingUsers({session:viewer})).unwrap()]);setState((s)=>({...s,loading:false}));}catch(error){setState((s)=>({...s,loading:false,error:error.message}));}},[dispatch,viewer]);
  useEffect(()=>{load();},[load]);
  const enriched=useMemo(()=>items.map((item)=>({...item,requestedUserId:item.relatedUserId,requestedUser:pending.find((u)=>u.id===item.relatedUserId)})),[items,pending]);
  const displayed=enriched.filter((item)=>filter==="all"||item.status===filter);
  // every action: backend first, Redux is updated by the thunk on success
  const fail=(error)=>setState((s)=>({...s,busy:"",error:error.message}));
  const decide=async(user,decision,notification)=>{setState((s)=>({...s,busy:`${decision}-${user.id}`,error:"",success:""}));try{await dispatch(decideSignup({session:viewer,id:user.id,decision})).unwrap();if(notification?.id){await dispatch(markNotificationAsRead({id:notification.id,viewer})).unwrap();}setState((s)=>({...s,busy:"",success:`${user.name} ${decision === "approve" ? "approved" : "rejected"} successfully.`}));}catch(error){fail(error);}};
  const markRead=async(item)=>{try{await dispatch(markNotificationAsRead({id:item.id,viewer})).unwrap();}catch(error){fail(error);}};
  const markAll=async()=>{try{await dispatch(markAllNotificationsAsRead({viewer})).unwrap();}catch(error){fail(error);}};
  const clearAll=async()=>{if(!window.confirm("Clear all notifications for this account?"))return;try{await dispatch(clearAllNotifications({viewer})).unwrap();}catch(error){fail(error);}};
  const remove=async(item)=>{try{await dispatch(deleteNotification({id:item.id,viewer})).unwrap();}catch(error){fail(error);}};
  return <main className="role-page admin-role-page admin-notifications"><header className="admin-notif-header"><div className="admin-notif-heading"><div><h1>Notifications</h1><p>View alerts and updates related to community activity.</p></div><span className="admin-unread-pill">{items.filter((item)=>item.status==="unread").length} Unread</span></div><div className="admin-notif-controls"><select className="role-select" value={filter} onChange={(e)=>setFilter(e.target.value)} aria-label="Filter notifications"><option value="all">All Notifications</option><option value="unread">Unread</option><option value="read">Read</option></select><div className="role-actions"><button className="role-button" onClick={markAll}><FiCheck /> Mark All Read</button><button className="role-button secondary" onClick={clearAll}><FiTrash2 /> Clear All</button></div></div></header>
    {state.error&&<div className="role-alert" role="alert">{state.error}</div>}{state.success&&<div className="role-alert success" role="status">{state.success}</div>}
    <section className="role-panel"><div className="role-head"><div><h2>Signup requests</h2><p>{pending.length} pending in your assigned community.</p></div></div>{pending.length===0?<div className="role-empty">No signup requests are waiting for approval.</div>:<div className="role-table-wrap"><table className="role-table"><thead><tr><th>Applicant</th><th>Role</th><th>Contact</th><th>Community</th><th>Actions</th></tr></thead><tbody>{pending.map((user)=>{const notice=items.find((item)=>item.requestedUserId===user.id);return <tr key={user.id}><td>{user.name}<div className="role-muted">{user.email}</div></td><td>{user.role?.replaceAll("_"," ")}</td><td>{user.phone||"â€”"}</td><td>{user.communityName||"â€”"}</td><td><div className="role-actions"><button className="role-button" disabled={Boolean(state.busy)} onClick={()=>decide(user,"approve",notice)}>{state.busy===`approve-${user.id}`?"Approvingâ€¦":"Approve"}</button><button className="role-button danger" disabled={Boolean(state.busy)} onClick={()=>decide(user,"reject",notice)}>{state.busy===`reject-${user.id}`?"Rejectingâ€¦":"Reject"}</button></div></td></tr>;})}</tbody></table></div>}</section>
    <section className="admin-notification-list" aria-label="Notifications">{state.loading?<div className="role-panel role-empty">Loading notifications...</div>:displayed.length===0?<div className="role-panel role-empty">No notifications match this filter.</div>:displayed.map((item)=><article className={`admin-notification-item ${item.status==="unread"?"unread":"read"}`} key={item.id}><span className={`admin-notif-icon ${item.type||"info"}`}>{item.type==="error"?<FiAlertTriangle />:item.type==="success"?<FiCheck />:item.type==="warning"?<FiAlertTriangle />:item.relatedUserId?<FiUserPlus />:<FiBell />}</span><div className="admin-notif-content"><div className="admin-notif-title-row"><div><h2>{notificationTitle(item)} {item.status==="unread"&&<span className="admin-new-pill">New</span>}</h2><span className="admin-notif-category">{item.category||String(item.type||"Community update").replaceAll("_"," ")}</span></div><time><FiClock /> {item.time||item.createdAt||"Recently"}</time></div><p>{item.message}</p><div className="admin-notif-actions">{item.status==="unread"&&<button className="mark-read-btn" onClick={()=>markRead(item)}><FiCheck /> Mark as Read</button>}<button className="del-notif-btn" onClick={()=>remove(item)}><FiTrash2 /> Delete</button></div></div></article>)}</section>
  </main>;
}