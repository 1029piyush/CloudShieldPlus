import { useEffect, useState } from "react";
import { Settings as SettingsIcon, User, ShieldAlert, Key, Globe } from "lucide-react";

function Settings() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    return (
        <div style={{ padding: "30px", color: "#F1F5F9", fontFamily: "Inter, sans-serif" }}>
            <div style={{ marginBottom: "30px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: "700", color: "white", margin: 0 }}>
                    Settings
                </h1>
                <p style={{ fontSize: "14px", color: "#94A3B8", marginTop: "4px" }}>
                    Configure CloudIntercept system keys, credentials scopes, and active session properties.
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "30px", maxWidth: "800px" }}>
                {/* Profile Settings */}
                <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                    <h3 style={{ fontSize: "18px", color: "white", margin: "0 0 20px 0", borderBottom: "1px solid #1E293B", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <User size={18} style={{ color: "#38BDF8" }} /> Security Profile
                    </h3>
                    {user ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "6px" }}>Username</label>
                                <div style={{ padding: "10px 12px", backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "6px", color: "white", fontSize: "14px" }}>
                                    {user.username}
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "6px" }}>Google Account Email</label>
                                <div style={{ padding: "10px 12px", backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "6px", color: "white", fontSize: "14px" }}>
                                    {user.email}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: "#94A3B8" }}>No active user profile loaded.</div>
                    )}
                </div>

                {/* Session Settings */}
                <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                    <h3 style={{ fontSize: "18px", color: "white", margin: "0 0 20px 0", borderBottom: "1px solid #1E293B", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Key size={18} style={{ color: "#38BDF8" }} /> Cryptographic Key Scope
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ fontSize: "14px", color: "#CBD5E1" }}>
                            AWS credentials storage is encrypted utilizing standard AES-CBC symmetric block keys (Fernet) resolved at startup.
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#10B981", backgroundColor: "#064E3B", padding: "10px 14px", borderRadius: "6px", marginTop: "10px" }}>
                            <ShieldAlert size={16} />
                            <span>AES Cryptographic Fernet Engine is ACTIVE & securely running.</span>
                        </div>
                    </div>
                </div>

                {/* Client OAuth Scope */}
                <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                    <h3 style={{ fontSize: "18px", color: "white", margin: "0 0 20px 0", borderBottom: "1px solid #1E293B", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Globe size={18} style={{ color: "#38BDF8" }} /> Identity Provider Configuration
                    </h3>
                    <div>
                        <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "6px" }}>Google Client ID (Read Only)</label>
                        <div style={{ padding: "10px 12px", backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "6px", color: "#94A3B8", fontSize: "13px", fontFamily: "monospace", overflowX: "auto" }}>
                            870630654060-p427495s5r1fub6v54qsk8hfl8lphg7c.apps.googleusercontent.com
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;
