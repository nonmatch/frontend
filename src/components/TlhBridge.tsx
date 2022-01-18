import { useEffect, useState } from "react";
import { TLH_URL } from "../constants";
import './TlhBridge.css';
import io, { Socket } from "socket.io-client";
import eventBus from "../eventBus";

let socket: Socket;

export const TlhBridge: React.FC = () => {

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isEditorPage, setIsEditorPage] = useState(false);
    const [currentFunction, setCurrentFunction] = useState('');

    const connect = () => {
        setError(null);
        setIsConnecting(true);
        setIsConnected(false);
        socket = io(TLH_URL);
        socket.on('disconnect', function () {
            setError(Error('Disconnected'));
        });
        socket.on('connect_error', function () {
            setError(Error('Connection failed'));
        });
        socket.on('connect', () => {
            setIsConnecting(false);
            setIsConnected(true);
            socket.emit('client_connected');
        });
        socket.on('asm_code', (data) => {
            eventBus.dispatch('asm_code', data);
        });
        socket.on('c_code', (data) => {
            eventBus.dispatch('c_code', data);
        });
        socket.on('add_c_code', (data) => {
            eventBus.dispatch('add_c_code', data);
        });
        socket.on('request_c_code', () => {
            eventBus.dispatch('request_c_code', null);
        });
        socket.on('extracted_data', (data) => {
            eventBus.dispatch('extracted_data', data);
            // TODO return error somehow?
            /*if (data['status'] === 'ok') {
                cEditor.editor.executeEdits('CExploreBridge', [
                    { range: cEditor.editor.getSelection(), text: data['text'] }
                ]);
            } else if (data['status'] === 'error') {
                error(data['text']);
            }*/
        });
    };

    const disconnect = () => {
        console.log(socket);
        if (socket) {
            socket.disconnect();
        } else {
            setError(Error('Not connected'));
        }
    }

    const fetchDecompilation = () => {
        if (socket) {
            socket.emit('fetch_decompilation', currentFunction);
        }
    };
    const uploadFunction = () => {
        if (socket) {
            socket.emit('upload_function', currentFunction);
        }
    };



    useEffect(() => {
        const sendCCode = (data: string) => {
            console.log('sendCCode', data);
            if (socket) {
                socket.emit('c_code', data);
            }
        };
        const onEditorPage = (data: boolean) => {
            setIsEditorPage(data);
        };
        const onCurrentFunction = (data: string) => {
            setCurrentFunction(data);
        }

        eventBus.on('send_c_code', sendCCode);
        eventBus.on('on_editor_page', onEditorPage);
        eventBus.on('current-function', onCurrentFunction);
        return () => {
            eventBus.remove('send_c_code', sendCCode);
            eventBus.remove('on_editor_page', onEditorPage);
            eventBus.remove('current-function', onCurrentFunction);
        };
    }, []);

    if (error) {
        return (
            <li className="nav-item">
                <span className="nav-link" onClick={connect}>
                    {error.message}
                    <span className="indicator error"></span>
                </span>
            </li>);
    } else if (isConnecting) {
        return (
        <li className="nav-item">
            <span className="nav-link">
                Connecting
                <span className="indicator"></span>
            </span>
        </li>);
    } else if (isConnected) {
        return (
            <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" id="navbarDropdown" href="/" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Tlh Bridge
                    <span className="indicator success"></span>
                </a>
                <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                    {isEditorPage && <>
                  <li><button className="dropdown-item" onClick={fetchDecompilation}>Fetch Decompilation from Ghidra</button></li>
                  <li><button className="dropdown-item" onClick={uploadFunction}>Upload Function to Repo</button></li>
                  <li><hr className="dropdown-divider" /></li>
                    </>}
                  <li><button className="dropdown-item" onClick={disconnect}>Disconnect</button></li>
                </ul>
              </li>
        );
    } else {
        return (
            <li className="nav-item">
                <span onClick={connect} className="nav-link">
                    Connect to tlh
                </span>
            </li>
        );
    }
}